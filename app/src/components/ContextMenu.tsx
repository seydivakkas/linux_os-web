// ============================================================
// ContextMenu — Dynamic right-click menu with edge detection
// ============================================================

import { useEffect, useRef, memo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : null;
};

const ContextMenu = memo(function ContextMenu() {
  const { state, dispatch } = useOS();
  const fs = useFileSystem();
  const menuRef = useRef<HTMLDivElement>(null);
  const { contextMenu } = state;

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = () => dispatch({ type: 'HIDE_CONTEXT_MENU' });
    const handleContext = (e: MouseEvent) => {
      // Close current menu on another right-click outside
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        dispatch({ type: 'HIDE_CONTEXT_MENU' });
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick, { once: true });
      window.addEventListener('contextmenu', handleContext);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContext);
    };
  }, [contextMenu.visible, dispatch]);

  // Edge detection
  let x = contextMenu.x;
  let y = contextMenu.y;
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw) x = vw - rect.width - 8;
    if (y + rect.height > vh) y = vh - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
  }

  if (!contextMenu.visible) return null;

  const handleAction = (action: string) => {
    dispatch({ type: 'HIDE_CONTEXT_MENU' });
    const [cmd, ...args] = action.split(':');

    switch (cmd) {
      case 'OPEN_APP': {
        if (args[0]) dispatch({ type: 'OPEN_WINDOW', appId: args[0] });
        break;
      }
      case 'NEW_FOLDER': {
        // Create a folder in the virtual filesystem at home
        const homeNode = fs.findNodeByPath('/home/user');
        if (homeNode) {
          const name = `New Folder ${Date.now().toString(36).slice(-4)}`;
          fs.createFolder(homeNode.id, name);
          dispatch({
            type: 'ADD_NOTIFICATION',
            notification: {
              appId: 'filemanager',
              appName: 'File Manager',
              appIcon: 'Folder',
              title: 'Folder Created',
              message: `"${name}" was created on the desktop`,
              isRead: false,
            },
          });
        }
        break;
      }
      case 'NEW_DOCUMENT': {
        const homeNode = fs.findNodeByPath('/home/user');
        if (homeNode) {
          const name = `Untitled ${Date.now().toString(36).slice(-4)}.txt`;
          fs.createFile(homeNode.id, name, '');
          dispatch({
            type: 'ADD_NOTIFICATION',
            notification: {
              appId: 'texteditor',
              appName: 'Text Editor',
              appIcon: 'FileText',
              title: 'Document Created',
              message: `"${name}" was created`,
              isRead: false,
            },
          });
        }
        break;
      }
      case 'CHANGE_BG': {
        // Cycle through built-in wallpaper colors
        const wallpapers = [
          '/wallpaper-default.jpg',
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          'linear-gradient(135deg, #0c0c0c 0%, #1a0533 50%, #2d1b69 100%)',
          'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
          'linear-gradient(135deg, #232526 0%, #414345 100%)',
          'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
          'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
          'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
        ];
        const currentIdx = wallpapers.indexOf(state.theme.wallpaper);
        const nextIdx = (currentIdx + 1) % wallpapers.length;
        dispatch({ type: 'SET_THEME', theme: { wallpaper: wallpapers[nextIdx] } });
        break;
      }
      case 'ARRANGE_ICONS': {
        // Auto-arrange icons in a grid
        state.desktopIcons.forEach((icon, i) => {
          const col = Math.floor(i / 6);
          const row = i % 6;
          dispatch({
            type: 'UPDATE_DESKTOP_ICON_POSITION',
            id: icon.id,
            position: { x: 16 + col * 80, y: 16 + row * 90 },
          });
        });
        break;
      }
      case 'SHOW_SETTINGS': {
        dispatch({ type: 'OPEN_WINDOW', appId: 'settings' });
        break;
      }
      case 'OPEN_TERMINAL': {
        dispatch({ type: 'OPEN_WINDOW', appId: 'terminal' });
        break;
      }
      case 'MINIMIZE_ALL': {
        dispatch({ type: 'MINIMIZE_ALL' });
        break;
      }
      case 'CASCADE': {
        dispatch({ type: 'CASCADE_WINDOWS' });
        break;
      }
      case 'TRASH': {
        const iconId = contextMenu.contextData?.iconId as string | undefined;
        if (iconId) {
          dispatch({ type: 'REMOVE_DESKTOP_ICON', id: iconId });
        }
        break;
      }
      case 'REMOVE_ICON': {
        const iconId2 = contextMenu.contextData?.iconId as string | undefined;
        if (iconId2) {
          dispatch({ type: 'REMOVE_DESKTOP_ICON', id: iconId2 });
        }
        break;
      }
      case 'PIN_DOCK': {
        if (args[0]) dispatch({ type: 'PIN_DOCK_ITEM', appId: args[0] });
        break;
      }
      case 'UNPIN_DOCK': {
        if (args[0]) dispatch({ type: 'UNPIN_DOCK_ITEM', appId: args[0] });
        break;
      }
      case 'QUIT_APP': {
        if (args[0]) {
          const appWindows = state.windows.filter((w) => w.appId === args[0]);
          appWindows.forEach((w) => dispatch({ type: 'CLOSE_WINDOW', windowId: w.id }));
        }
        break;
      }
      case 'TOGGLE_THEME': {
        dispatch({ type: 'TOGGLE_THEME' });
        break;
      }
      case 'SET_COLOR_THEME': {
        if (args[0]) {
          dispatch({ type: 'SET_THEME', theme: { colorTheme: args[0] as import('@/types').ColorTheme } });
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[4000] py-1.5 select-none"
      style={{
        left: x,
        top: y,
        minWidth: 200,
        maxWidth: 300,
        background: 'var(--bg-context-menu)',
        borderRadius: 10,
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        animation: 'ctxAppear 120ms cubic-bezier(0, 0, 0.2, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {contextMenu.items.map((item) => {
        if (item.divider) {
          return (
            <div
              key={item.id}
              className="my-1 mx-3"
              style={{ height: 1, background: 'var(--border-subtle)' }}
            />
          );
        }
        return (
          <button
            key={item.id}
            className="w-full flex items-center gap-2.5 px-3 h-8 text-[13px] transition-colors"
            style={{
              color: item.disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
              borderRadius: 6,
              margin: '0 4px',
              width: 'calc(100% - 8px)',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => {
              if (item.disabled) return;
              handleAction(item.action);
            }}
          >
            {item.icon && (
              <DynamicIcon name={item.icon} size={15} className="shrink-0 opacity-70" />
            )}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-[var(--text-disabled)] ml-auto pl-3 font-mono">{item.shortcut}</span>
            )}
          </button>
        );
      })}

      <style>{`
        @keyframes ctxAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default ContextMenu;
