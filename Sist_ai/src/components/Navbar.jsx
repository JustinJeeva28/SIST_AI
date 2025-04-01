import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import SistImg from "./SistImg";
const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate("/login");
    };

    return (
        <div className="border border-gray-300 bg-gray-200 flex items-center p-4 shadow-md justify-between">
            <div className="flex items-center">
                <SistImg/>
                <button 
                    onClick={() => navigate("/")} 
                    className="text-3xl font-bold tracking-wide text-gray-800 transition-all duration-300 hover:text-blue-600 hover:scale-105">
                    <span className="uppercase">SIST</span>
                    <span className="text-blue-600">AI</span>
                </button>
            </div>
            <div className="flex gap-4">
            <a
                href="https://erp.sathyabama.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-white hover:bg-blue-500 transition-all duration-300 shadow-md cursor-pointer"
            >
                ERP Sathyabama
            </a>

            <a
                href="https://sathyabama.cognibot.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-gray-600 hover:text-white hover:bg-blue-500 transition-all duration-300 shadow-md cursor-pointer"
            >
                LMS Sathyabama
            </a>
            </div>
            {user && (
                <button
                    onClick={handleLogout}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-all"
                >
                    Logout
                </button>
            )}
        </div>
    );
};

export default Navbar;
