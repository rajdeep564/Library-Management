const  {UserModel} = require("../model/UserModel");
const { BookModel } = require("../model/BookModel");
const { BorrowModel } = require("../model/BorrowModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { logAction } = require("../utils/auditLogger");
const { getCache, setCache } = require("../utils/cache");
const calculateFine = require("../utils/fineCalculator");
const { getFineSettings } = require("../utils/systemConfig");
const adminController = {};

adminController.addLibrarian = async (req, res) => {
    try {
        const { name, email, password,role } = req.body;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({
            name,
      email,
      password: hashedPassword,
      role
        });
// console.log(user);
        await user.save();

        await logAction({
          action: "LIBRARIAN_ADDED",
          performedBy: req.userInfo.id,
          performedByName: req.userInfo.name,
          performedByRole: req.userInfo.role,
          targetId: user._id,
          targetType: "User",
          details: `Librarian added: ${user.email}`,
          req
        });

        res.status(201).json({ message: "Librarian Added Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

adminController.login = async (req,res)=>{

    try {
        const {email,password} = req.body;
        // console.log("email,password");
        console.log(email,password);
        // const email="abc@gmail.com";
        // const password="123";
        const user = await UserModel.findOne({ email });
        // console.log("user");
        // console.log(user);
        // console.log("print")
        // console.log(user);
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
          }
          if (user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
          }
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
          }
          const payload = {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

          await logAction({
            action: "USER_LOGIN",
            performedBy: user._id,
            performedByName: user.name,
            performedByRole: user.role,
            details: `Admin login from ${req.ip || "unknown"}`,
            req
          });

          res.json({ message: "Login successful", token, user: { name: user.name, email: user.email, role: user.role } });
        //   res.json({ message: "Login successful"});
        
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

adminController.getDashboard = async (req, res) => {
  try {
    const cached = getCache("adminDashboard");
    if (cached) {
      return res.json({ error: false, message: "Dashboard from cache", ...cached });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const config = await getFineSettings();

    const [
      totalBooks,
      totalMembers,
      issuedBooks,
      pendingRequests,
      overdueBooks,
      returnRequests,
      categories,
    ] = await Promise.all([
      BookModel.countDocuments(),
      UserModel.countDocuments({ role: "user" }),
      BorrowModel.countDocuments({ status: "Issued" }),
      BorrowModel.countDocuments({ status: "Requested" }),
      BorrowModel.countDocuments({ status: "Issued", dueDate: { $lt: today } }),
      BorrowModel.find({ status: "Requested Return" }).select("dueDate returnDate").lean(),
      BookModel.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const fineCollected = returnRequests.reduce((sum, loan) => {
      const { cappedFine } = calculateFine(loan.dueDate, loan.returnDate, config);
      return sum + cappedFine;
    }, 0);

    const payload = {
      stats: {
        totalBooks,
        issuedBooks,
        totalMembers,
        overdueBooks,
        fineCollected,
        pendingRequests,
      },
      categories: categories.map((c) => ({
        category: c._id || "Unknown",
        count: c.count,
      })),
    };

    setCache("adminDashboard", payload);
    res.json({ error: false, message: "Dashboard loaded", ...payload });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: true, message: error.message });
  }
};


module.exports = {adminController};