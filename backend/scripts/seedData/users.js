const { memberId } = require("./constants");

const STAFF = [
  {
    name: "Dr. Rajesh M. Shah",
    email: "admin@svpdl.gov.in",
    role: "admin",
    employeeId: "SVPDL/EMP/001",
    department: "Administration",
    phone: "9876543210",
    city: "Anand",
  },
  {
    name: "Smt. Bharati R. Patel",
    email: "librarian1@svpdl.gov.in",
    role: "librarian",
    employeeId: "SVPDL/EMP/002",
    department: "Circulation",
    phone: "9876543211",
    city: "Anand",
  },
  {
    name: "Shri. Kiran K. Desai",
    email: "librarian2@svpdl.gov.in",
    role: "librarian",
    employeeId: "SVPDL/EMP/003",
    department: "Cataloguing",
    phone: "9876543212",
    city: "Anand",
  },
];

const MEMBERS = [
  { name: "Amit Desai", email: "amit.desai@gmail.com", stream: "Engineering", year: 2, phone: "9825012345", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Priya Patel", email: "priya.patel@gmail.com", stream: "Commerce", year: 3, phone: "9825012346", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Vikram Solanki", email: "vikram.solanki@gmail.com", stream: "Arts", year: 1, phone: "9825012347", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Neha Joshi", email: "neha.joshi@gmail.com", stream: "Science", year: 2, phone: "9825012348", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Mahesh Chauhan", email: "mahesh.chauhan@gmail.com", stream: "General Membership", year: 1, phone: "9825012349", city: "Anand", membershipType: "General", membershipExpiry: new Date("2026-12-31") },
  { name: "Asha Raval", email: "asha.raval@gmail.com", stream: "General Membership", year: 1, phone: "9825012350", city: "Anand", membershipType: "Senior Citizen", membershipExpiry: new Date("2026-12-31") },
  { name: "Deepak Modi", email: "deepak.modi@gmail.com", stream: "Engineering", year: 3, phone: "9825012351", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Kiran Makwana", email: "kiran.makwana@gmail.com", stream: "Commerce", year: 1, phone: "9825012352", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Sunita Sharma", email: "sunita.sharma@gmail.com", stream: "General Membership", year: 1, phone: "9825012353", city: "Anand", membershipType: "General", membershipExpiry: new Date("2026-12-31") },
  { name: "Hitesh Parmar", email: "hitesh.parmar@gmail.com", stream: "Science", year: 3, phone: "9825012354", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Ritu Panchal", email: "ritu.panchal@gmail.com", stream: "Arts", year: 2, phone: "9825012355", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Suresh Vasava", email: "suresh.vasava@gmail.com", stream: "General Membership", year: 1, phone: "9825012356", city: "Anand", membershipType: "General", membershipExpiry: new Date("2025-12-31") },
  { name: "Geeta Bhatt", email: "geeta.bhatt@gmail.com", stream: "General Membership", year: 1, phone: "9825012357", city: "Anand", membershipType: "Senior Citizen", membershipExpiry: new Date("2026-12-31") },
  { name: "Naresh Thakor", email: "naresh.thakor@gmail.com", stream: "Engineering", year: 1, phone: "9825012358", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Pooja Shah", email: "pooja.shah@gmail.com", stream: "Commerce", year: 2, phone: "9825012359", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Ramesh Rathod", email: "ramesh.rathod@gmail.com", stream: "General Membership", year: 1, phone: "9825012360", city: "Anand", membershipType: "General", membershipExpiry: new Date("2026-12-31") },
  { name: "Varsha Prajapati", email: "varsha.prajapati@gmail.com", stream: "Science", year: 1, phone: "9825012361", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Jagdish Nayak", email: "jagdish.nayak@gmail.com", stream: "Arts", year: 3, phone: "9825012362", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Manisha Gohil", email: "manisha.gohil@gmail.com", stream: "General Membership", year: 1, phone: "9825012363", city: "Anand", membershipType: "General", membershipExpiry: new Date("2026-12-31") },
  { name: "Bharat Agrawal", email: "bharat.agrawal@gmail.com", stream: "Engineering", year: 2, phone: "9825012364", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Dhruv Kapadia", email: "dhruv.kapadia@gmail.com", stream: "Commerce", year: 3, phone: "9825012365", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Chandrika Mehta", email: "chandrika.mehta@gmail.com", stream: "General Membership", year: 1, phone: "9825012366", city: "Anand", membershipType: "Senior Citizen", membershipExpiry: new Date("2024-12-31") },
  { name: "Sandip Baria", email: "sandip.baria@gmail.com", stream: "Science", year: 2, phone: "9825012367", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Lata Vyas", email: "lata.vyas@gmail.com", stream: "Arts", year: 1, phone: "9825012368", city: "Anand", membershipType: "Student", membershipExpiry: new Date("2026-06-30") },
  { name: "Rohit Dave", email: "rohit.dave@gmail.com", stream: "General Membership", year: 1, phone: "9825012369", city: "Anand", membershipType: "General", membershipExpiry: new Date("2026-12-31") },
];

function getStaffUsers() {
  return STAFF.map((s) => ({ ...s, isSeedData: true }));
}

function getMemberUsers() {
  return MEMBERS.map((m, i) => ({
    ...m,
    role: "user",
    memberId: memberId(i + 1),
    isSeedData: true,
  }));
}

function getAllUserDefs() {
  return [...getStaffUsers(), ...getMemberUsers()];
}

module.exports = {
  STAFF,
  MEMBERS,
  getStaffUsers,
  getMemberUsers,
  getAllUserDefs,
};
