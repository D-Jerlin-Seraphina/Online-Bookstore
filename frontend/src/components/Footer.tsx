export const Footer = () => (
  <footer className="border-t border-slate-200 bg-slate-50">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-slate-600">
      <p>© {new Date().getFullYear()} Chapter & Chill. All rights reserved.</p>
      <div className="flex gap-4">
        <a href="#" className="hover:text-blue-600">
          Terms
        </a>
        <a href="#" className="hover:text-blue-600">
          Privacy
        </a>
        <a href="#" className="hover:text-blue-600">
          Contact
        </a>
      </div>
    </div>
  </footer>
);
