/* eslint-disable react/prop-types */
import { useEffect, lazy, Suspense, Component } from 'react';
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer } from "react-toastify";
import './App.css';
import Userlayout from "./layout/userlayout";
import AdminLayout from "./layout/adminlayout";
import Home from "./pages/user/home";
import AdminLogin from "./pages/admin/AdminLogin";
import PageLoader from "./components/ui/PageLoader";

// Lazy load secondary page components
const Login = lazy(() => import("./pages/user/login"));
const Register = lazy(() => import('./pages/user/register'));
const Books = lazy(() => import('./pages/user/books'));
const AllCategories = lazy(() => import('./pages/user/allcategories'));
const AdminDashboard = lazy(() => import('./pages/admin/admindashboard'));
const AddBookForm = lazy(() => import('./pages/admin/addbook'));
const ViewBooks = lazy(() => import('./pages/admin/viewbook'));
const AddLibrarian = lazy(() => import('./pages/admin/AddLibrarian'));
const BookDetails = lazy(() => import('./pages/user/bookdetails'));
const ProfilePage = lazy(() => import('./pages/user/profile'));
const LibrarianRequests = lazy(() => import('./pages/librarian/LibrarianRequest'));
const ReturnRequest = lazy(() => import('./pages/librarian/ReturnRequest'));
const AboutUs = lazy(() => import('./pages/user/AboutUs'));
const ContactUs = lazy(() => import('./pages/user/ContactUs'));
const BooksBorrowed = lazy(() => import('./pages/librarian/BooksBorrowed'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const FineManagement = lazy(() => import('./pages/admin/FineManagement'));
const LibrarySettings = lazy(() => import('./pages/admin/LibrarySettings'));
const QRManager = lazy(() => import('./pages/admin/QRManager'));
const BulkImport = lazy(() => import('./pages/admin/BulkImport'));
const SendNotification = lazy(() => import('./pages/admin/SendNotification'));
const ForgotPassword = lazy(() => import('./pages/user/ForgetPassword/ForgetPassword'));
const VerifyOTP = lazy(() => import('./pages/user/ForgetPassword/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/user/ForgetPassword/UpdatePassword'));

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }
  componentDidCatch(error) {
    console.error("Page failed to render:", error);
  }
  componentDidUpdate(prevProps) {
    if (this.props.pathname !== prevProps.pathname && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gov-bg)", padding: 24 }}>
          <div className="gov-card" style={{ maxWidth: 480, textAlign: "center" }}>
            <h4 style={{ color: "var(--gov-text-primary)", marginBottom: 8 }}>Something went wrong</h4>
            <p style={{ color: "var(--gov-text-light)", fontSize: 14, marginBottom: 8 }}>
              Try refreshing the page. If the problem continues, restart the frontend and backend servers.
            </p>
            {this.state.errorMessage && (
              <p style={{ color: "var(--gov-danger)", fontSize: 12, marginBottom: 16, fontFamily: "monospace" }}>
                {this.state.errorMessage}
              </p>
            )}
            <button type="button" className="btn-gov-primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ErrorBoundaryWithReset({ children }) {
  const location = useLocation();
  return <ErrorBoundary pathname={location.pathname}>{children}</ErrorBoundary>;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && location.pathname === "/") {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "admin" || decoded.role === "librarian") {
          navigate("/admin");
        } else if (decoded.role === "user") {
          navigate("/");
        }
      } catch (err) {
        console.error("Token decode failed", err);
        localStorage.removeItem("authToken");
        localStorage.removeItem("role");
      }
    }
  }, [location.pathname, navigate]);

  return (
    <ErrorBoundaryWithReset>
    <Suspense fallback={<PageLoader label="Loading page..." />}>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/" element={<Userlayout/>}>
          <Route index element={<Home/>}/>
          <Route path='/books' element={<Books/>}/>
          <Route path='/bookdetails/:id' element={<BookDetails/>}/>
          <Route path='/category' element={<AllCategories/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/aboutus" element={<AboutUs/>}/>
          <Route path="/contactus" element={<ContactUs/>}/>
          <Route path="/forgetPassword" element={<ForgotPassword/>}/>
          <Route path="/verifyotp" element={<VerifyOTP/>}/>
          <Route path="/resetpass" element={<ResetPassword/>}/>
        </Route>
        
        <Route path='/admin' element={<AdminLayout/>}>
          <Route index element={<AdminDashboard/>}/>
          <Route path='addbook' element={<AddBookForm/>}/>
          <Route path='viewbook' element={<ViewBooks/>}/>
          <Route path='addlibrarian' element={<AddLibrarian/>}/>
          <Route path='issuerequest' element={<LibrarianRequests/>}/>
          <Route path='returnrequest' element={<ReturnRequest/>}/>
          <Route path='issued' element={<BooksBorrowed/>}/>
          <Route path='reports' element={<Reports/>}/>
          <Route path='auditlog' element={<AuditLog/>}/>
          <Route path='fines' element={<FineManagement/>}/>
          <Route path='settings' element={<LibrarySettings/>}/>
          <Route path='qr-codes' element={<QRManager/>}/>
          <Route path='books/bulk-import' element={<BulkImport/>}/>
          <Route path='send-notification' element={<SendNotification/>}/>
        </Route>
        
        <Route path='/user' element={<Userlayout/>}>
          <Route index element={<ProfilePage/>}/>         
        </Route>
      </Routes>
    </Suspense>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    </ErrorBoundaryWithReset>
  )
}

export default App;