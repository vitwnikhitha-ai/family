export default function getProfileImage(member) {
  if (!member) return null;
  const name = (member.fullName || '').toLowerCase().trim();
  
  if (name.includes('nikhil') && !name.includes('tha')) return '/nikhil.webp';
  if (name.includes('nikhitha') || name.includes('nikhiltha')) return '/nikhiltha.webp';
  if (name.includes('praveen')) return '/praveen.webp';
  if (name.includes('swarna') || name.includes('kumari')) return '/swarna kumari.webp';
  if (name.includes('nageswarao') || name.includes('nageswararao')) return '/nageswarao.webp';
  
  if (member.profilePhoto) {
    if (member.profilePhoto.startsWith('/uploads/')) {
      const baseUrl = import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000';
      return `${baseUrl}${member.profilePhoto}`;
    }
    return member.profilePhoto;
  }
  return null;
}
