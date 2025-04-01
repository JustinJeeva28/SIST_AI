import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      {/* Welcome Section */}
      <div className="relative flex items-center justify-center h-screen bg-[url('https://www.sathyabama.ac.in/sites/default/files/inline-images/DJI_0221_0.jpg')] bg-cover bg-center" style={{ height: "500px" }}>
        <div className="relative max-w-xl mx-auto p-8 bg-white/95 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to SIST AI Chatbot</h1>
          <p className="text-gray-700 mt-4">Your smart virtual assistant, ready to help 24/7.</p>
          <Link 
            to="/login"
            className="mt-6 inline-block bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#b5838d] transition-all duration-300 shadow-md"
          >
            Login
          </Link>
        </div>
      </div>

      {/* About SIST-AI Section */}
      <div className="bg-gray-100 pt-5 pb-10">
        <div className="text-3xl text-center font-bold text-gray-900">About SIST-AI</div>
        <p className="text-lg text-center px-6 mt-4 text-gray-700">
          SIST AI is an intelligent chatbot designed to provide instant and accurate information about 
          <span className="font-semibold"> Sathyabama Institute of Science and Technology.</span> Whether you're a student, faculty member, or visitor, SIST AI is here to assist you with all your queries regarding 
          admissions, courses, campus facilities, events, exam schedules, and more.
        </p>

        {/* Features Section */}
        <div className="mt-12 text-center">
          <div className="text-3xl font-bold text-gray-900">What Can SIST-AI Answer?</div>
          <ul className="mt-6 text-lg text-gray-700 leading-relaxed space-y-2 px-8">
            <li>💡 <span className="font-semibold">Admissions & Courses:</span> Eligibility, fees, and syllabus details.</li>
            <li>🏫 <span className="font-semibold">Campus Facilities:</span> Hostel, library, labs, transport, and canteen info.</li>
            <li>📅 <span className="font-semibold">Events & Schedules:</span> Exam dates, college fests, and workshops.</li>
            <li>📜 <span className="font-semibold">Rules & Guidelines:</span> Attendance policies, dress codes, and more.</li>
            <li>🔍 <span className="font-semibold">Placement & Career:</span> Internship opportunities, placement cell info.</li>
            <li>🆘 <span className="font-semibold">Technical Support:</span> Help with university portals and online services.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
