import React, { useState, useCallback, useEffect } from 'react';

function TodoList({ taskListId, boardName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userEmail = localStorage.getItem('user_email');
      console.log('Fetching items for taskListId:', taskListId, 'user:', userEmail);
      const itemsResponse = await fetch(`/.netlify/functions/zoho-tasks?taskListId=${taskListId}&userId=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
      });
      console.log('Fetch URL:', `/.netlify/functions/zoho-tasks?taskListId=${taskListId}`);

      console.log('Items response status:', itemsResponse.status);
      console.log('Items response headers:', Object.fromEntries(itemsResponse.headers.entries()));

      if (!itemsResponse.ok) {
        const errorText = await itemsResponse.text();
        console.log('Items response error:', errorText);
        throw new Error('Failed to fetch items');
      }

      const itemsData = await itemsResponse.json();
      console.log('Items data:', itemsData);

      const boardItems = itemsData.data || [];
      console.log('Found items for board', taskListId, ':', boardItems);

      // Transform items to match expected format with column_values
      const transformedItems = boardItems.map(item => ({
        id: item.id,
        name: item.name,
        column_values: item.column_values || []
      }));

      console.log('Setting transformed items:', transformedItems);
      setItems(transformedItems);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskListId]);

  useEffect(() => {
    if (taskListId) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [taskListId, fetchItems]);

  const createItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasks?taskListId=${taskListId}&userId=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItemName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      setNewItemName('');
      fetchItems(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const updateItem = async (id, name) => {
    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasks?userId=${encodeURIComponent(userEmail)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      setEditingItem(null);
      setEditName('');
      fetchItems(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (id) => {
    console.log('Deleting item:', id);
    try {
      const userEmail = localStorage.getItem('user_email');
      const response = await fetch(`/.netlify/functions/zoho-tasks?itemId=${id}&userId=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Delete response error:', errorText);
        throw new Error('Failed to delete item');
      }

      console.log('Item deleted successfully, refreshing items...');
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message);
    }
  };

  const toggleDone = async (item) => {
    console.log('Toggling item:', item);
    console.log('Available columns:', item.column_values);
    
    // Find the actual status column (it might have a different ID)
    const statusColumn = item.column_values.find(col =>
      col.id === 'status' || col.text === 'Done' || col.text === 'Working on it' || col.type === 'color'
    );
    
    if (!statusColumn) {
      console.error('No status column found. Available columns:', item.column_values);
      setError('This board does not have a status column');
      return;
    }

    const currentStatus = statusColumn?.text || 'Working on it';
    const newStatus = currentStatus === 'Done' ? 'Working on it' : 'Done';

    console.log('Status column ID:', statusColumn.id);
    console.log('Current status:', currentStatus, 'New status:', newStatus);

    try {
      const userEmail = localStorage.getItem('user_email');
      const columnValues = {};
      columnValues[statusColumn.id] = newStatus;
      
      console.log('Sending column values:', columnValues);
      
      const response = await fetch(`/.netlify/functions/zoho-tasks?userId=${encodeURIComponent(userEmail)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          taskListId: taskListId,
          columnValues: columnValues
        }),
      });

      console.log('Toggle response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Toggle response error:', errorText);
        throw new Error('Failed to update item status');
      }

      console.log('Status updated successfully, refreshing items...');
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error('Error toggling item:', err);
      setError(err.message);
    }
  };

  const startEditing = (item) => {
    setEditingItem(item.id);
    setEditName(item.name);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditName('');
  };

  const saveEditing = () => {
    if (editName.trim()) {
      updateItem(editingItem, editName);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{boardName || 'Todo List'}</h2>

      {loading && <p>Loading items...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && items.length === 0 && <p>No items found in this board.</p>}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add new todo item"
          style={{ padding: '5px', marginRight: '10px', width: '70%' }}
        />
        <button onClick={createItem} style={{ padding: '5px 10px' }}>Add</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map(item => (
          <li key={item.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
            {editingItem === item.id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: '5px', flex: '1' }}
                />
                <button onClick={saveEditing} style={{ padding: '5px 10px' }}>Save</button>
                <button onClick={cancelEditing} style={{ padding: '5px 10px' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={item.column_values.some(col => col.text === 'Done')}
                    onChange={() => toggleDone(item)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{
                    textDecoration: item.column_values.some(col => col.text === 'Done') ? 'line-through' : 'none',
                    color: item.column_values.some(col => col.text === 'Done') ? '#666' : '#000'
                  }}>
                    {item.name}
                  </span>
                </div>
                <div>
                  <button onClick={() => startEditing(item)} style={{ padding: '5px 10px', marginRight: '5px' }}>Edit</button>
                  <button onClick={() => deleteItem(item.id)} style={{ padding: '5px 10px', backgroundColor: '#ff4444', color: 'white' }}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;