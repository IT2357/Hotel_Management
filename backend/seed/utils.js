import crypto from 'crypto';

export const cities = ["Colombo","Kandy","Galle","Jaffna","Negombo","Anuradhapura","Trincomalee","Batticaloa","Matara","Nuwara Eliya"];
export const sriLankaDistricts = ["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"];
export const sriFoods = [
  { name: "Kottu Roti", tamil: "கோத்து ரொட்டி" },
  { name: "Hoppers (Appam)", tamil: "ஆப்பம்" },
  { name: "String Hoppers", tamil: "இடியாகப்பம்" },
  { name: "Jaffna Crab Curry", tamil: "யாழ் நண்டு குழம்பு" },
  { name: "Pol Sambol", tamil: "போல் சம்போல்" },
  { name: "Dhal Curry", tamil: "பருப்பு குழம்பு" },
  { name: "Watalappan", tamil: "வட்டலப்பம்" },
  { name: "Milk Tea", tamil: "பால் தேநீர்" },
  { name: "Fish Ambul Thiyal", tamil: "அம்புள் தியல்" },
  { name: "Lamprais", tamil: "லம்ப்ரைஸ்" }
];

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

export const imageFor = (topic, w = 800, h = 600) => `https://images.unsplash.com/photo-155${randomInt(1000,9999)}?q=80&w=${w}&h=${h}&fit=crop&auto=format&${encodeURIComponent(topic)}`;
export const avatar = (seed) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;

export const randPhoneLK = () => `+94${randomInt(70,79)}${randomInt(1000000,9999999)}`;
export const randEmail = (name) => `${slugify(name)}${randomInt(10,99)}@example.lk`;

export const randAddressLK = () => ({
  country: 'Sri Lanka',
  city: pick(cities),
  street: `${randomInt(1, 200)} ${pick(['Galle Rd','Kandy Rd','Temple Rd','Beach Rd','Main St'])}`,
  postalCode: `${randomInt(10000, 99999)}`,
});

export const genToken = () => crypto.randomBytes(16).toString('hex');

export const dates = {
  futureMinutes: (mins) => new Date(Date.now() + mins * 60000),
  pastDays: (d) => new Date(Date.now() - d * 86400000),
  futureDays: (d) => new Date(Date.now() + d * 86400000),
};
