import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { Footer } from './Footer.tsx';
import { AssistantChat } from './AssistantChat.tsx';

export const Layout = () => (
  <div className="flex min-h-screen flex-col bg-slate-50">
    <Navbar />
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Outlet />
    </main>
    <Footer />
    <AssistantChat />
  </div>
);
