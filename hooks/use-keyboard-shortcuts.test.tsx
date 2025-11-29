import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './use-keyboard-shortcuts';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call action when keyboard shortcut is pressed', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should work with metaKey (Cmd on Mac)', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        metaKey: true,
        action: mockAction,
        description: 'Command Palette',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Cmd+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should handle shortcuts with shift key', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'p',
        ctrlKey: true,
        shiftKey: true,
        action: mockAction,
        description: 'Open Command Palette',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+Shift+P
    const event = new KeyboardEvent('keydown', {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should handle shortcuts with alt key', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'f',
        altKey: true,
        action: mockAction,
        description: 'Search',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Alt+F
    const event = new KeyboardEvent('keydown', {
      key: 'f',
      altKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should not call action when modifier keys do not match', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate just 'S' without Ctrl
    const event = new KeyboardEvent('keydown', {
      key: 's',
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should be case insensitive', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+S with uppercase
    const event = new KeyboardEvent('keydown', {
      key: 'S',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple shortcuts', () => {
    const mockSave = vi.fn();
    const mockOpen = vi.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockSave,
        description: 'Save',
      },
      {
        key: 'o',
        ctrlKey: true,
        action: mockOpen,
        description: 'Open',
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Ctrl+S
    const saveEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(saveEvent);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();

    // Simulate Ctrl+O
    const openEvent = new KeyboardEvent('keydown', {
      key: 'o',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(openEvent);
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listeners on unmount', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    unmount();

    // Simulate Ctrl+S after unmount
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });
});

describe('KeyboardShortcutsHelp', () => {
  const shortcuts = [
    {
      key: 's',
      ctrlKey: true,
      description: 'Save document',
    },
    {
      key: 'k',
      metaKey: true,
      description: 'Command Palette',
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      description: 'Preview',
    },
  ];

  it('should not render help dialog by default', () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('should show help dialog when Shift+? is pressed', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Simulate Shift+?
    await act(async () => {
      const event = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('should display all shortcuts in help dialog', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Show help
    await act(async () => {
      const event = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(screen.getByText('Save document')).toBeInTheDocument();
      expect(screen.getByText('Command Palette')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
    });
  });

  it('should close help dialog when background is clicked', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Show help
    await act(async () => {
      const showEvent = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(showEvent);
    });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Click background
    const background = screen.getByText('Keyboard Shortcuts').closest('.fixed');
    if (background) {
      await act(async () => {
        fireEvent.click(background);
      });
    }

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  it('should close help dialog when close button is clicked', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Show help
    await act(async () => {
      const showEvent = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(showEvent);
    });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByText('✕');
    await act(async () => {
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  it('should toggle help dialog when Shift+? is pressed again', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Show help
    const showEvent = new KeyboardEvent('keydown', {
      key: '?',
      shiftKey: true,
      bubbles: true,
    });
    
    await act(async () => {
      document.dispatchEvent(showEvent);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    // Toggle off
    await act(async () => {
      document.dispatchEvent(showEvent);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });

  it('should not close when clicking inside the dialog content', async () => {
    render(<KeyboardShortcutsHelp shortcuts={shortcuts} />);

    // Show help
    await act(async () => {
      const showEvent = new KeyboardEvent('keydown', {
        key: '?',
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(showEvent);
    });

    await waitFor(() => {
      expect(screen.getByText('Save document')).toBeInTheDocument();
    });

    // Click inside dialog
    const dialogContent = screen.getByText('Save document').closest('.bg-card');
    if (dialogContent) {
      await act(async () => {
        fireEvent.click(dialogContent);
      });
    }

    // Dialog should still be visible
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });
});
