import Navbar from "./Navbar";
import Footer from "./Footer";

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-cinemaBlack text-cinemaText">
      <Navbar />
      <main className="min-h-screen pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;