import express from 'express';
import db from '../utils/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import upload, { uploadToCloud } from '../utils/upload.js';

const router = express.Router();

/**
 * Mask Aadhaar number for security
 */
function maskAadhaar(aadhaar) {
  if (!aadhaar) return '';
  const decrypted = decrypt(aadhaar);
  if (decrypted.length < 4) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${decrypted.slice(-4)}`;
}

/**
 * Filter/Mask private fields for non-owners
 */
function applyPrivacyFilter(member, currentUserProfileId) {
  if (!member) return null;
  
  const obj = typeof member.toObject === 'function' ? member.toObject() : { ...member };
  const isOwner = currentUserProfileId && obj._id.toString() === currentUserProfileId.toString();

  // Default values if settings not present
  const settings = obj.privacySettings || {
    dateOfBirth: 'Public',
    phoneNumber: 'Public',
    aadhaarNumber: 'Private',
    address: 'Public',
    occupation: 'Public'
  };

  obj.isDobPrivate = settings.dateOfBirth === 'Private';
  obj.isPhonePrivate = settings.phoneNumber === 'Private';
  obj.isAadhaarPrivate = settings.aadhaarNumber === 'Private';
  obj.isAddressPrivate = settings.address === 'Private';
  obj.isOccupationPrivate = settings.occupation === 'Private';

  if (!isOwner) {
    if (settings.dateOfBirth === 'Private') {
      obj.dateOfBirth = null;
    }
    if (settings.phoneNumber === 'Private') {
      obj.phoneNumber = 'Hidden (Private)';
    }
    if (settings.aadhaarNumber === 'Private') {
      obj.aadhaarNumber = 'Hidden (Private)';
    }
    if (settings.address === 'Private') {
      obj.address = 'Hidden (Private)';
    }
    if (settings.occupation === 'Private') {
      obj.occupation = 'Hidden (Private)';
    }
  }

  // Process custom fields privacy
  if (obj.customFields && Array.isArray(obj.customFields)) {
    obj.customFields = obj.customFields.map(cf => {
      const cfObj = cf && typeof cf.toObject === 'function' ? cf.toObject() : { ...cf };
      cfObj.isPrivate = cfObj.privacy === 'Private';
      if (!isOwner && cfObj.privacy === 'Private') {
        return null; // completely hide private custom fields from others
      }
      
      // Decrypt the custom field value for the frontend
      if (cfObj.value) {
        cfObj.value = decrypt(cfObj.value);
      }
      
      return cfObj;
    }).filter(Boolean);
  }

  // Populate recursion safely
  if (obj.father && typeof obj.father === 'object' && obj.father.fullName) {
    obj.father = applyPrivacyFilter(obj.father, currentUserProfileId);
  }
  if (obj.mother && typeof obj.mother === 'object' && obj.mother.fullName) {
    obj.mother = applyPrivacyFilter(obj.mother, currentUserProfileId);
  }
  if (obj.spouse && typeof obj.spouse === 'object' && obj.spouse.fullName) {
    obj.spouse = applyPrivacyFilter(obj.spouse, currentUserProfileId);
  }
  if (obj.children && Array.isArray(obj.children)) {
    obj.children = obj.children.map(child => 
      (child && typeof child === 'object' && child.fullName) 
        ? applyPrivacyFilter(child, currentUserProfileId) 
        : child
    );
  }

  return obj;
}

/**
 * @route   GET /api/members
 * @desc    Get all family members with search, pagination, and filters
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, gender, relation, maritalStatus, page = 1, limit = 100 } = req.query;
    
    // Construct query filter
    const query = {};
    
    if (gender) query.gender = gender;
    if (relation) query.relation = relation;
    if (maritalStatus) query.maritalStatus = maritalStatus;
    
    if (search) {
      // String searches on fields
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { occupation: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ];
    }

    const members = await db.Member.find(query);
    
    // Manual pagination and populate since mock db doesn't fully support mongoose schema population chains natively
    let populatedMembers;
    if (typeof members.populate === 'function') {
      populatedMembers = await members.populate('father mother spouse children');
    } else {
      populatedMembers = await db.Member.populate(members, { path: 'father mother spouse children' });
    }
    
    // Mask Aadhaar numbers and apply privacy settings
    const sanitizedMembers = populatedMembers.map(m => {
      let obj = typeof m.toObject === 'function' ? m.toObject() : { ...m };
      
      // Decrypt and apply mask helper for list
      obj.aadhaarNumber = maskAadhaar(obj.aadhaarNumber);
      
      return applyPrivacyFilter(obj, req.user.memberProfile);
    });

    res.json({
      members: sanitizedMembers,
      total: sanitizedMembers.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ message: 'Server error fetching members.', error: error.message });
  }
});

/**
 * @route   GET /api/members/stats
 * @desc    Get dashboard stats
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const members = await db.Member.find({});
    
    const total = members.length;
    const male = members.filter(m => m.gender === 'Male').length;
    const female = members.filter(m => m.gender === 'Female').length;
    const married = members.filter(m => m.maritalStatus === 'Married').length;
    
    // Get recent updates (last 5 members added/updated)
    const sorted = [...members].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const recentUpdates = sorted.slice(0, 5).map(m => ({
      _id: m._id,
      fullName: m.fullName,
      relation: m.relation,
      gender: m.gender,
      updatedAt: m.updatedAt
    }));

    res.json({
      total,
      male,
      female,
      married,
      recentUpdates
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics.', error: error.message });
  }
});

/**
 * @route   GET /api/members/:id
 * @desc    Get member details by ID (with decrypted Aadhaar)
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === 'root') {
      targetId = req.user.memberProfile;
    }
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      return res.status(400).json({ message: 'Invalid family member ID.' });
    }
    const member = await db.Member.findById(targetId);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found.' });
    }

    let populated;
    if (typeof member.populate === 'function') {
      populated = await member.populate('father mother spouse children');
    } else {
      const results = await db.Member.populate([member], { path: 'father mother spouse children' });
      populated = results[0];
    }
    let obj = typeof populated.toObject === 'function' ? populated.toObject() : { ...populated };
    
    // Decrypt Aadhaar for detailed view
    obj.aadhaarNumber = decrypt(obj.aadhaarNumber);

    const sanitized = applyPrivacyFilter(obj, req.user.memberProfile);
    res.json(sanitized);
  } catch (error) {
    console.error('Fetch member details error:', error);
    res.status(500).json({ message: 'Server error fetching member details.', error: error.message });
  }
});

/**
 * @route   POST /api/members
 * @desc    Add a new family member
 * @access  Private (Admins only)
 */
router.post('/', authenticateToken, requireAdmin, upload.single('profilePhoto'), async (req, res) => {
  try {
    const memberData = { ...req.body };
    
    // Encrypt Aadhaar number before storing
    if (memberData.aadhaarNumber) {
      memberData.aadhaarNumber = encrypt(memberData.aadhaarNumber);
    }

    // Set privacySettings
    memberData.privacySettings = {
      dateOfBirth: req.body.privacySettings_dateOfBirth || 'Public',
      phoneNumber: req.body.privacySettings_phoneNumber || 'Public',
      aadhaarNumber: req.body.privacySettings_aadhaarNumber || 'Private',
      address: req.body.privacySettings_address || 'Public',
      occupation: req.body.privacySettings_occupation || 'Public'
    };
    
    // Handle image upload
    if (req.file) {
      memberData.profilePhoto = await uploadToCloud(req.file);
    }

    // Set nullable references and extract IDs if objects are passed
    memberData.father = (memberData.father && memberData.father._id) ? memberData.father._id : (memberData.father || null);
    memberData.mother = (memberData.mother && memberData.mother._id) ? memberData.mother._id : (memberData.mother || null);
    memberData.spouse = (memberData.spouse && memberData.spouse._id) ? memberData.spouse._id : (memberData.spouse || null);
    memberData.children = memberData.children ? (typeof memberData.children === 'string' ? JSON.parse(memberData.children) : memberData.children) : [];
    memberData.children = memberData.children.map(c => c._id || c);
    memberData.customFields = memberData.customFields ? (typeof memberData.customFields === 'string' ? JSON.parse(memberData.customFields) : memberData.customFields) : [];
    
    // Encrypt custom field values before saving
    if (memberData.customFields.length > 0) {
      memberData.customFields = memberData.customFields.map(cf => ({
        ...cf,
        value: encrypt(cf.value)
      }));
    }

    memberData.createdBy = req.user.id;

    // Create the member
    const newMember = await db.Member.create(memberData);
    
    // Maintain bidirectional relationships
    const memberId = newMember._id;

    // 1. Link to father
    if (memberData.father) {
      const father = await db.Member.findById(memberData.father);
      if (father) {
        father.children = father.children || [];
        if (!father.children.map(c => c.toString()).includes(memberId.toString())) {
          father.children.push(memberId);
          await father.save();
        }
      }
    }

    // 2. Link to mother
    if (memberData.mother) {
      const mother = await db.Member.findById(memberData.mother);
      if (mother) {
        mother.children = mother.children || [];
        if (!mother.children.map(c => c.toString()).includes(memberId.toString())) {
          mother.children.push(memberId);
          await mother.save();
        }
      }
    }

    // 3. Link to spouse
    if (memberData.spouse) {
      const spouse = await db.Member.findById(memberData.spouse);
      if (spouse) {
        spouse.spouse = memberId;
        await spouse.save();
      }
    }

    // 4. Link children to this parent
    if (memberData.children && memberData.children.length > 0) {
      for (const childId of memberData.children) {
        const child = await db.Member.findById(childId);
        if (child) {
          if (newMember.gender === 'Male') {
            child.father = memberId;
          } else if (newMember.gender === 'Female') {
            child.mother = memberId;
          }
          await child.save();
        }
      }
    }

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ message: 'Server error creating family member.', error: error.message });
  }
});

/**
 * @route   PUT /api/members/:id
 * @desc    Update a family member
 * @access  Private (Admins only)
 */
router.put('/:id', authenticateToken, requireAdmin, upload.single('profilePhoto'), async (req, res) => {
  try {
    const memberId = req.params.id;
    const existingMember = await db.Member.findById(memberId);
    const isOwner = req.user.memberProfile && existingMember._id.toString() === req.user.memberProfile.toString();
    const isCreator = existingMember.createdBy && existingMember.createdBy.toString() === req.user.id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own profile or profiles created by you.' });
    }

    const updates = { ...req.body };
    
    // Aadhaar encrypt updates
    if (updates.aadhaarNumber) {
      updates.aadhaarNumber = encrypt(updates.aadhaarNumber);
    }

    // Set privacySettings
    updates.privacySettings = {
      dateOfBirth: req.body.privacySettings_dateOfBirth || (existingMember.privacySettings && existingMember.privacySettings.dateOfBirth) || 'Public',
      phoneNumber: req.body.privacySettings_phoneNumber || (existingMember.privacySettings && existingMember.privacySettings.phoneNumber) || 'Public',
      aadhaarNumber: req.body.privacySettings_aadhaarNumber || (existingMember.privacySettings && existingMember.privacySettings.aadhaarNumber) || 'Private',
      address: req.body.privacySettings_address || (existingMember.privacySettings && existingMember.privacySettings.address) || 'Public',
      occupation: req.body.privacySettings_occupation || (existingMember.privacySettings && existingMember.privacySettings.occupation) || 'Public'
    };
    
    // File upload updates
    if (req.file) {
      updates.profilePhoto = await uploadToCloud(req.file);
    }

    updates.father = (updates.father && updates.father._id) ? updates.father._id : (updates.father || null);
    updates.mother = (updates.mother && updates.mother._id) ? updates.mother._id : (updates.mother || null);
    updates.spouse = (updates.spouse && updates.spouse._id) ? updates.spouse._id : (updates.spouse || null);
    updates.children = updates.children ? (typeof updates.children === 'string' ? JSON.parse(updates.children) : updates.children) : [];
    updates.children = updates.children.map(c => c._id || c);
    updates.customFields = updates.customFields ? (typeof updates.customFields === 'string' ? JSON.parse(updates.customFields) : updates.customFields) : [];

    // Encrypt custom field values before saving
    if (updates.customFields.length > 0) {
      updates.customFields = updates.customFields.map(cf => ({
        ...cf,
        value: encrypt(cf.value)
      }));
    }

    // Perform the update
    const updatedMember = await db.Member.findByIdAndUpdate(memberId, updates, { new: true });

    // Synchronize relationships (clean old relations and apply new ones)
    // 1. Father cleanup/re-link
    if (existingMember.father && existingMember.father.toString() !== updates.father) {
      const oldFather = await db.Member.findById(existingMember.father);
      if (oldFather) {
        oldFather.children = (oldFather.children || []).filter(c => c.toString() !== memberId.toString());
        await oldFather.save();
      }
    }
    if (updates.father) {
      const father = await db.Member.findById(updates.father);
      if (father) {
        father.children = father.children || [];
        if (!father.children.map(c => c.toString()).includes(memberId.toString())) {
          father.children.push(memberId);
          await father.save();
        }
      }
    }

    // 2. Mother cleanup/re-link
    if (existingMember.mother && existingMember.mother.toString() !== updates.mother) {
      const oldMother = await db.Member.findById(existingMember.mother);
      if (oldMother) {
        oldMother.children = (oldMother.children || []).filter(c => c.toString() !== memberId.toString());
        await oldMother.save();
      }
    }
    if (updates.mother) {
      const mother = await db.Member.findById(updates.mother);
      if (mother) {
        mother.children = mother.children || [];
        if (!mother.children.map(c => c.toString()).includes(memberId.toString())) {
          mother.children.push(memberId);
          await mother.save();
        }
      }
    }

    // 3. Spouse cleanup/re-link
    if (existingMember.spouse && existingMember.spouse.toString() !== updates.spouse) {
      const oldSpouse = await db.Member.findById(existingMember.spouse);
      if (oldSpouse) {
        oldSpouse.spouse = null;
        await oldSpouse.save();
      }
    }
    if (updates.spouse) {
      const spouse = await db.Member.findById(updates.spouse);
      if (spouse) {
        spouse.spouse = memberId;
        await spouse.save();
      }
    }

    // 4. Children relations updates
    const oldChildrenIds = (existingMember.children || []).map(c => c.toString());
    const newChildrenIds = (updates.children || []).map(c => c.toString());

    // Children removed
    for (const oldChildId of oldChildrenIds) {
      if (!newChildrenIds.includes(oldChildId)) {
        const child = await db.Member.findById(oldChildId);
        if (child) {
          if (existingMember.gender === 'Male') child.father = null;
          else if (existingMember.gender === 'Female') child.mother = null;
          await child.save();
        }
      }
    }

    // Children added
    for (const newChildId of newChildrenIds) {
      if (!oldChildrenIds.includes(newChildId)) {
        const child = await db.Member.findById(newChildId);
        if (child) {
          if (existingMember.gender === 'Male') child.father = memberId;
          else if (existingMember.gender === 'Female') child.mother = memberId;
          await child.save();
        }
      }
    }

    res.json(updatedMember);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error updating family member.', error: error.message });
  }
});

/**
 * @route   DELETE /api/members/:id
 * @desc    Delete a family member
 * @access  Private (Admins only)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const memberId = req.params.id;
    const member = await db.Member.findById(memberId);
    const isOwner = req.user.memberProfile && member._id.toString() === req.user.memberProfile.toString();
    const isCreator = member.createdBy && member.createdBy.toString() === req.user.id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own profile or profiles created by you.' });
    }

    // Clean up references to this member in other records
    // 1. Remove from Father's children
    if (member.father) {
      const father = await db.Member.findById(member.father);
      if (father) {
        father.children = father.children.filter(c => c.toString() !== memberId.toString());
        await father.save();
      }
    }

    // 2. Remove from Mother's children
    if (member.mother) {
      const mother = await db.Member.findById(member.mother);
      if (mother) {
        mother.children = mother.children.filter(c => c.toString() !== memberId.toString());
        await mother.save();
      }
    }

    // 3. Unlink Spouse
    if (member.spouse) {
      const spouse = await db.Member.findById(member.spouse);
      if (spouse) {
        spouse.spouse = null;
        await spouse.save();
      }
    }

    // 4. Unlink Parents for Children
    if (member.children && member.children.length > 0) {
      for (const childId of member.children) {
        const child = await db.Member.findById(childId);
        if (child) {
          if (member.gender === 'Male') child.father = null;
          else if (member.gender === 'Female') child.mother = null;
          await child.save();
        }
      }
    }

    // Also delete any associated user profile or documents
    const associatedUser = await db.User.findOne({ memberProfile: memberId });
    if (associatedUser) {
      associatedUser.memberProfile = null;
      await associatedUser.save();
    }

    // Delete member document entries
    const docs = await db.Document.find({ memberId });
    for (const doc of docs) {
      await db.Document.findByIdAndDelete(doc._id);
    }

    await db.Member.findByIdAndDelete(memberId);

    res.json({ message: 'Family member deleted and relationship links cleaned successfully.' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Server error deleting family member.', error: error.message });
  }
});

export default router;
