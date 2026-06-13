export default function getProfileImage(member) {
  if (!member) return null;
  const name = (member.fullName || '').toLowerCase().trim();
  
  if (name.includes('nikhil') && !name.includes('tha')) return '/nikhil.jpeg';
  if (name.includes('nikhitha') || name.includes('nikhiltha')) return '/nikhiltha.jpeg';
  if (name.includes('praveen')) return '/praveen.jpeg';
  if (name.includes('swarna') || name.includes('kumari')) return '/swarna kumari.jpeg';
  
  if (member.profilePhoto) {
    if (member.profilePhoto.startsWith('/uploads/')) return `http://localhost:5000${member.profilePhoto}`;
    return member.profilePhoto;
  }
  return null;
}
