import React, { useState } from 'react';

function BoardManagement({ boards, onBoardChange }) {
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoard, setEditingBoard] = useState(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createBoard = async () => {
    if (!newBoardName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasklists?userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newBoardName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create board');
      }

      setNewBoardName('');
      onBoardChange(); // Refresh boards
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBoard = async (id, name) => {
    setLoading(true);
    setError(null);

    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasklists?userId=${encodeURIComponent(userEmail)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update board');
      }

      setEditingBoard(null);
      setEditBoardName('');
      onBoardChange(); // Refresh boards
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBoard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;

    setLoading(true);
    setError(null);

    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasklists?taskListId=${id}&userId=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete board');
      }

      onBoardChange(); // Refresh boards
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditingBoard = (board) => {
    setEditingBoard(board.id);
    setEditBoardName(board.name);
  };

  const cancelEditingBoard = () => {
    setEditingBoard(null);
    setEditBoardName('');
  };

  const saveEditingBoard = () => {
    if (editBoardName.trim()) {
      updateBoard(editingBoard, editBoardName);
    }
  };

  return (
    <div style={{
      margin: '20px',
      padding: '20px',
      border: '1px solid #333',
      borderRadius: '8px',
      backgroundColor: '#fff',
      color: '#000'
    }}>
      <h3 style={{ color: '#000', marginBottom: '15px' }}>Board Management</h3>

      {error && <p style={{ color: '#dc3545', marginBottom: '15px' }}>{error}</p>}

      {/* Horizontal layout for board management */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Board List with Edit/Delete */}
        <div style={{ flex: '1' }}>
          <h4 style={{ color: '#000', marginBottom: '10px' }}>Manage Existing Boards</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {boards.map(board => (
              <div key={board.id} style={{
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}>
                {editingBoard === board.id ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={editBoardName}
                      onChange={(e) => setEditBoardName(e.target.value)}
                      style={{
                        padding: '5px',
                        borderRadius: '4px',
                        border: '1px solid #333',
                        backgroundColor: '#fff',
                        color: '#000',
                        flex: '1'
                      }}
                    />
                    <button
                      onClick={saveEditingBoard}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#1a365d',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditingBoard}
                      style={{
                        padding: '5px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#666',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#000', flex: '1' }}>{board.name}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => startEditingBoard(board)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#1a365d',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBoard(board.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Create New Board */}
        <div style={{ flex: '0 0 300px' }}>
          <h4 style={{ color: '#000', marginBottom: '10px' }}>Create New Board</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="New board name"
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #333',
                backgroundColor: '#fff',
                color: '#000',
                flex: '1'
              }}
            />
            <button
              onClick={createBoard}
              disabled={loading}
              style={{
                padding: '8px 15px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#1a365d',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardManagement;