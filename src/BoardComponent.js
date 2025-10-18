import React, { useState, useEffect } from 'react';
import TodoList from './TodoList.js';

function BoardComponent({ boards, defaultBoardIndex = 0 }) {
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedBoardName, setSelectedBoardName] = useState('Board View');

  useEffect(() => {
    // Set a different default board for each component if boards are available
    if (boards.length > 0 && !selectedBoardId) {
      const defaultIndex = Math.min(defaultBoardIndex, boards.length - 1);
      const defaultBoard = boards[defaultIndex];
      setSelectedBoardId(defaultBoard.id);
      setSelectedBoardName(defaultBoard.name);
    }
  }, [boards, selectedBoardId, defaultBoardIndex]);

  const handleBoardSelect = (e) => {
    const boardId = e.target.value;
    setSelectedBoardId(boardId);
    const selectedBoard = boards.find(board => board.id === boardId);
    setSelectedBoardName(selectedBoard ? selectedBoard.name : 'Board View');
  };

  console.log('BoardComponent - boards:', boards);
  console.log('BoardComponent - selectedBoardId:', selectedBoardId);

  return (
    <div style={{
      margin: '20px',
      padding: '20px',
      border: '1px solid #333',
      borderRadius: '8px',
      backgroundColor: '#fff',
      color: '#000'
    }}>
      <h3 style={{ color: '#000', marginBottom: '15px' }}>Zoho Tasks Todo List</h3>

      {/* Board Selection Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#000', marginRight: '10px' }}>
          Select Board:
          <select
            value={selectedBoardId}
            onChange={handleBoardSelect}
            style={{
              marginLeft: '10px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #333',
              backgroundColor: '#fff',
              color: '#000'
            }}
          >
            <option value="">Select a board...</option>
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Todo List */}
      {selectedBoardId && (
        <TodoList boardId={selectedBoardId} boardName={selectedBoardName} />
      )}
    </div>
  );
}

export default BoardComponent;