import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import ScoresTicker from './ScoresTicker';

export default function Layout() {
  return (
    <div className="bg-x-bg min-h-screen">
      {/* Live Scores Ticker */}
      <ScoresTicker />

      <div className="max-w-[1300px] mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-[275px] shrink-0 hidden xl:block">
          <div className="sticky top-[48px] h-[calc(100vh-48px)] flex flex-col">
            <Sidebar />
          </div>
        </aside>

        {/* Mobile sidebar */}
        <aside className="w-[68px] shrink-0 xl:hidden">
          <div className="sticky top-[48px] h-[calc(100vh-48px)] flex flex-col">
            <Sidebar mobile />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 border-x border-x-border">
          <Outlet />
        </main>

        {/* Right Panel */}
        <aside className="w-[350px] shrink-0 hidden lg:block pl-8">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}
