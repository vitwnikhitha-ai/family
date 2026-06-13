function inferCrossRelation(currentRelRaw, targetRelRaw, targetGender, targetDob, currentDob) {
  const currentRel = currentRelRaw?.toLowerCase() || '';
  const targetRel = targetRelRaw?.toLowerCase() || '';

  const isCurrentParent = currentRel.includes('father') || currentRel.includes('mother') || currentRel === 'parent';
  const isTargetParent = targetRel.includes('father') || targetRel.includes('mother') || targetRel === 'parent';
  
  const isCurrentSibling = currentRel.includes('brother') || currentRel.includes('sister') || currentRel === 'sibling';
  const isTargetSibling = targetRel.includes('brother') || targetRel.includes('sister') || targetRel === 'sibling';

  const isCurrentSelf = currentRel === 'self';
  const isTargetSelf = targetRel === 'self';

  const isCurrentChild = currentRel.includes('son') || currentRel.includes('daughter') || currentRel === 'child';
  const isTargetChild = targetRel.includes('son') || targetRel.includes('daughter') || targetRel === 'child';

  const isCurrentSpouse = currentRel.includes('husband') || currentRel.includes('wife') || currentRel === 'spouse';
  const isTargetSpouse = targetRel.includes('husband') || targetRel.includes('wife') || targetRel === 'spouse';

  const getSiblingString = () => {
    if (!targetDob || !currentDob) return targetGender === 'Male' ? 'Brother' : 'Sister';
    const isElder = targetDob < currentDob;
    return targetGender === 'Male' ? (isElder ? 'Elder Brother' : 'Younger Brother') : (isElder ? 'Elder Sister' : 'Younger Sister');
  };

  if (isCurrentSelf) {
    if (isTargetSibling) return getSiblingString();
    return targetRelRaw || 'Relative';
  }

  if (isTargetSelf) {
    if (isCurrentParent) return targetGender === 'Male' ? 'Son' : 'Daughter';
    if (isCurrentChild) return targetGender === 'Male' ? 'Father' : 'Mother';
    if (isCurrentSibling) return getSiblingString();
    if (isCurrentSpouse) return targetGender === 'Male' ? 'Husband' : 'Wife';
    return 'Relative';
  }

  if (isCurrentParent) {
    if (isTargetParent) {
      if (currentRel.includes('father') && targetRel.includes('mother')) return 'Wife';
      if (currentRel.includes('mother') && targetRel.includes('father')) return 'Husband';
    }
    if (isTargetSibling) return targetGender === 'Male' ? 'Son' : 'Daughter';
  }

  if (isCurrentSibling) {
    if (isTargetParent) return targetGender === 'Male' ? 'Father' : 'Mother';
    if (isTargetSibling) return getSiblingString();
  }

  if (isCurrentChild) {
    if (isTargetSibling) return targetGender === 'Male' ? 'Uncle' : 'Aunt';
    if (isTargetParent) return targetGender === 'Male' ? 'Grandfather' : 'Grandmother';
  }
  
  if (isCurrentSpouse) {
      if (isTargetParent) return targetGender === 'Male' ? 'Father-in-law' : 'Mother-in-law';
      if (isTargetSibling) return targetGender === 'Male' ? 'Brother-in-law' : 'Sister-in-law';
      if (isTargetChild) return targetGender === 'Male' ? 'Son' : 'Daughter';
  }

  // If the target member is a child and current is a sibling
  if (isCurrentSibling && isTargetChild) {
      return targetGender === 'Male' ? 'Nephew' : 'Niece';
  }

  return targetRelRaw || 'Relative';
}

export function calculateRelation(targetMember, allMembers, currentUserProfileId) {
  const currentUser = allMembers?.find(m => m._id === currentUserProfileId);

  const getSafeFallback = (member) => {
    if (!member) return 'Unknown';
    if (!currentUser || !currentUser.relation) return member.relation || 'Relative';
    
    const targetDob = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
    const currentDob = currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth) : null;
    
    return inferCrossRelation(
      currentUser.relation, 
      member.relation, 
      member.gender, 
      targetDob, 
      currentDob
    );
  };

  if (!targetMember || !allMembers || !currentUserProfileId) return getSafeFallback(targetMember);
  if (!currentUser) return getSafeFallback(targetMember);

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
    const currentDob = new Date(currentUser.dateOfBirth);
    const targetDob = new Date(targetMember.dateOfBirth);
    const isElder = targetDob < currentDob;
    
    if (targetMember.gender === 'Male') {
      return isElder ? 'Elder Brother' : 'Younger Brother';
    } else {
      return isElder ? 'Elder Sister' : 'Younger Sister';
    }
  }

  // Fallback to cross-referencing relations
  return getSafeFallback(targetMember);
}


