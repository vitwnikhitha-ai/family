export function calculateRelation(targetMember, allMembers, currentUserProfileId) {
  if (!targetMember || !allMembers || !currentUserProfileId) return targetMember?.relation || 'Unknown';

  const currentUser = allMembers.find(m => m._id === currentUserProfileId);
  if (!currentUser) return targetMember.relation || 'Unknown';

  // 1. Self
  if (targetMember._id === currentUser._id) return 'Self';

  // 2. Parents
  if (currentUser.father && targetMember._id === currentUser.father) return 'Father';
  if (currentUser.mother && targetMember._id === currentUser.mother) return 'Mother';

  // 3. Spouse
  if (currentUser.spouse && targetMember._id === currentUser.spouse) {
    return targetMember.gender === 'Male' ? 'Husband' : 'Wife';
  }

  // 4. Children
  if (currentUser.children && currentUser.children.includes(targetMember._id)) {
    return targetMember.gender === 'Male' ? 'Son' : 'Daughter';
  }

  // 5. Siblings (Share at least one parent)
  const sharesFather = currentUser.father && targetMember.father === currentUser.father;
  const sharesMother = currentUser.mother && targetMember.mother === currentUser.mother;
  
  if (sharesFather || sharesMother) {
    // Determine Elder/Younger based on DOB (optional enhancement, but standard "Brother"/"Sister" is fine)
    const currentDob = new Date(currentUser.dateOfBirth);
    const targetDob = new Date(targetMember.dateOfBirth);
    const isElder = targetDob < currentDob;
    
    if (targetMember.gender === 'Male') {
      return isElder ? 'Elder Brother' : 'Younger Brother';
    } else {
      return isElder ? 'Elder Sister' : 'Younger Sister';
    }
  }

  // Fallback to the hardcoded database relation if no graph path is matched
  return targetMember.relation || 'Relative';
}
