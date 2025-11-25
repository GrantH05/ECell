import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import api from '../services/api';
import { User, Event } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'events' | 'create'>('profile');

  // Create event form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    type: 'workshop',
    maxParticipants: 100,
    imageUrl: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const profileResponse = await api.get('/user/profile');
      console.log('📥 Profile data received:', profileResponse.data.user);
      console.log('📝 Registered events:', profileResponse.data.user.registeredEvents);
      setUser(profileResponse.data.user);

      const eventsResponse = await api.get('/events');
      console.log('📅 Events data received:', eventsResponse.data.events);
      setEvents(eventsResponse.data.events);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleRegisterEvent = async (eventId: string) => {
    console.log('🎯 Attempting to register for event:', eventId);

    try {
      const response = await api.post(`/events/${eventId}/register`);
      console.log('✅ Registration successful:', response.data);

      // Immediately update user's registered events in state
      setUser(prevUser => {
        if (!prevUser) return prevUser;
        const updatedUser = {
          ...prevUser,
          registeredEvents: [...(prevUser.registeredEvents || []), eventId]
        };
        console.log('🔄 Updated user state:', updatedUser);
        return updatedUser;
      });

      // Update event's registered users count
      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event._id === eventId) {
            const updated = {
              ...event,
              registeredUsers: [...event.registeredUsers, user?._id || '']
            };
            console.log('🔄 Updated event:', updated);
            return updated;
          }
          return event;
        })
      );

      alert('✓ Successfully registered for the event!');

      // Refresh from server to ensure sync
      await fetchDashboardData();

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      alert(error.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setMessage(null);

    try {
      await api.post('/events', formData);

      setMessage({ type: 'success', text: '✓ Event created successfully!' });

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        type: 'workshop',
        maxParticipants: 100,
        imageUrl: '',
      });

      // Refresh events and switch to events tab
      await fetchDashboardData();
      setTimeout(() => {
        setActiveTab('events');
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create event' 
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getEventIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      workshop: '🛠️',
      seminar: '🎤',
      competition: '🏆',
      networking: '🤝',
      other: '📌',
    };
    return icons[type] || '📌';
  };

  // Helper function to check registration status
  const isUserRegistered = (eventId: string): boolean => {
    if (!user || !user.registeredEvents) {
      console.log('❌ No user or registeredEvents');
      return false;
    }

    // Convert both to strings for comparison
    const registeredIds = user.registeredEvents.map(id => String(id));
    const eventIdString = String(eventId);

    const isRegistered = registeredIds.includes(eventIdString);
    console.log(`🔍 Checking registration for event ${eventIdString}:`, isRegistered);
    console.log('   User registered events:', registeredIds);

    return isRegistered;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="dashboard-container">
      {/* Enhanced Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo">EC</div>
              <div className="header-text">
                <h1>E-Cell VIT Bhopal</h1>
                <p className="tagline">Entrepreneurship Cell</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="user-badge">
              <div className="avatar">{user?.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            My Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className="tab-icon">📅</span>
            Events
            {events.length > 0 && (
              <span className="event-badge">{events.length}</span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="tab-icon">➕</span>
            Create Event
            {isAdmin && <span className="admin-badge">Admin</span>}
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content fade-in">
            <div className="profile-header">
              <div className="profile-avatar-large">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-header-info">
                <h2>{user?.name}</h2>
                <p className="profile-subtitle">{user?.branch} • Year {user?.year}</p>
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{user?.registeredEvents?.length || 0}</span>
                    <span className="stat-label">Events Registered</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-number">{isAdmin ? 'Admin' : 'Member'}</span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-card">
                <div className="detail-icon">📧</div>
                <div className="detail-content">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{user?.email}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">🎓</div>
                <div className="detail-content">
                  <span className="detail-label">Roll Number</span>
                  <span className="detail-value">{user?.rollNumber}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📱</div>
                <div className="detail-content">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{user?.phone}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">🏢</div>
                <div className="detail-content">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{user?.branch}</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">📚</div>
                <div className="detail-content">
                  <span className="detail-label">Academic Year</span>
                  <span className="detail-value">{user?.year} Year</span>
                </div>
              </div>

              <div className="detail-card">
                <div className="detail-icon">⭐</div>
                <div className="detail-content">
                  <span className="detail-label">Member Since</span>
                  <span className="detail-value">
                    {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="tab-content fade-in">
            <div className="events-header">
              <h2>Upcoming Events</h2>
              <p className="events-subtitle">Discover and register for exciting entrepreneurship events</p>
            </div>

            {events.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">📭</div>
                <h3>No Events Available</h3>
                <p>Check back soon for exciting upcoming events!</p>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((event) => {
  const isRegistered = isUserRegistered(event._id);
  const isFull = event.registeredUsers.length >= event.maxParticipants;
  const hasImage = event.imageUrl && event.imageUrl.trim() !== '';

  return (
    <div key={event._id} className={`event-card-modern ${hasImage ? 'has-image' : ''}`}>
      {/* Event Image (if provided) */}
      {hasImage ? (
        <div className="event-image-container">
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="event-image"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="event-image-placeholder">
                  ${getEventIcon(event.type)}
                </div>
              `;
            }}
          />
          <div className="event-image-overlay">
            <span className={`event-type-badge ${event.type}`}>
              {event.type}
            </span>
          </div>
        </div>
      ) : null}

      {/* Event Content */}
      <div className="event-card-content">
        {/* Header (icon + badge) - only show if no image */}
        {!hasImage && (
          <div className="event-card-header">
            <span className="event-icon">{getEventIcon(event.type)}</span>
            <span className={`event-type-badge ${event.type}`}>
              {event.type}
            </span>
          </div>
        )}

        {/* Show icon for cards with images */}
        {hasImage && (
          <div className="event-card-header">
            <span className="event-icon">{getEventIcon(event.type)}</span>
          </div>
        )}

        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>

        <div className="event-info-grid">
          <div className="event-info-item">
            <span className="info-icon">📅</span>
            <div className="info-text">
              <span className="info-label">Date</span>
              <span className="info-value">{formatDate(event.date)}</span>
            </div>
          </div>

          <div className="event-info-item">
            <span className="info-icon">🕒</span>
            <div className="info-text">
              <span className="info-label">Time</span>
              <span className="info-value">{event.time}</span>
            </div>
          </div>

          <div className="event-info-item">
            <span className="info-icon">📍</span>
            <div className="info-text">
              <span className="info-label">Venue</span>
              <span className="info-value">{event.venue}</span>
            </div>
          </div>

          <div className="event-info-item">
            <span className="info-icon">👥</span>
            <div className="info-text">
              <span className="info-label">Capacity</span>
              <span className="info-value">
                {event.registeredUsers.length}/{event.maxParticipants}
              </span>
            </div>
          </div>
        </div>

        <div className="event-card-footer">
          <div className="seats-indicator">
            <div className="seats-bar">
              <div 
                className="seats-fill"
                style={{ 
                  width: `${(event.registeredUsers.length / event.maxParticipants) * 100}%` 
                }}
              ></div>
            </div>
            <span className="seats-text">
              {event.maxParticipants - event.registeredUsers.length} seats left
            </span>
          </div>

          <button
            onClick={() => handleRegisterEvent(event._id)}
            className={`btn-register-modern ${isRegistered ? 'registered' : ''} ${isFull ? 'full' : ''}`}
            disabled={isFull || isRegistered}
          >
            {isRegistered ? (
              <>
                <span>✓</span> Registered
              </>
            ) : isFull ? (
              <>
                <span>🔒</span> Event Full
              </>
            ) : (
              <>
                <span>+</span> Register Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
})}
              </div>
            )}
          </div>
        )}

        {/* Create Event Tab - keeping your existing create tab code */}
        {activeTab === 'create' && (
          <div className="tab-content fade-in">
            {!isAdmin ? (
              <div className="access-denied">
                <div className="access-denied-icon">🔒</div>
                <h2>Admin Access Required</h2>
                <p>Only administrators can create events. If you need to create an event, please contact an E-Cell admin.</p>
                <div className="access-denied-info">
                  <div className="info-box">
                    <span className="info-icon">👤</span>
                    <div>
                      <strong>Your Role:</strong> {isAdmin ? 'Admin' : 'Member'}
                    </div>
                  </div>
                  <div className="info-box">
                    <span className="info-icon">✉️</span>
                    <div>
                      <strong>Need Help?</strong> Contact mehul@ecell.vitbhopal.ac.in
                    </div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('events')} className="btn-back-to-events">
                  ← Back to Events
                </button>
              </div>
            ) : (
              <div className="create-event-container">
                <div className="create-event-header">
                  <h2>Create New Event</h2>
                  <p className="create-event-subtitle">Add a new event for E-Cell members</p>
                </div>

                <div className="create-event-content">
                  <form onSubmit={handleCreateEvent} className="event-form-compact">
                    {message && (
                      <div className={`message ${message.type}`}>
                        {message.text}
                      </div>
                    )}

                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="title">Event Title *</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleFormChange}
                          required
                          placeholder="e.g., Startup Pitch Competition 2025"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="type">Event Type *</label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="workshop">🛠️ Workshop</option>
                          <option value="seminar">🎤 Seminar</option>
                          <option value="competition">🏆 Competition</option>
                          <option value="networking">🤝 Networking</option>
                          <option value="other">📌 Other</option>
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="description">Description *</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          rows={3}
                          placeholder="Describe what the event is about..."
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="date">Date *</label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleFormChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="time">Time *</label>
                        <input
                          type="text"
                          id="time"
                          name="time"
                          value={formData.time}
                          onChange={handleFormChange}
                          required
                          placeholder="e.g., 10:00 AM - 4:00 PM"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="venue">Venue *</label>
                        <input
                          type="text"
                          id="venue"
                          name="venue"
                          value={formData.venue}
                          onChange={handleFormChange}
                          required
                          placeholder="e.g., Auditorium, Block A"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="maxParticipants">Max Participants *</label>
                        <input
                          type="number"
                          id="maxParticipants"
                          name="maxParticipants"
                          value={formData.maxParticipants}
                          onChange={handleFormChange}
                          required
                          min="1"
                        />
                      </div>

                      <div className="form-group full-width">
                        <label htmlFor="imageUrl">Event Image URL (Optional)</label>
                        <input
                          type="url"
                          id="imageUrl"
                          name="imageUrl"
                          value={formData.imageUrl}
                          onChange={handleFormChange}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>

                    <div className="form-actions-inline">
                      <button type="submit" className="btn-create-event" disabled={createLoading}>
                        {createLoading ? 'Creating...' : '✓ Create Event'}
                      </button>
                    </div>
                  </form>

                  <div className="event-preview-card">
                    <h3>Preview</h3>
                    <div className="event-card-modern preview">
                      <div className="event-card-header">
                        <span className="event-icon">{getEventIcon(formData.type)}</span>
                        <span className={`event-type-badge ${formData.type}`}>
                          {formData.type}
                        </span>
                      </div>

                      <h3 className="event-title">{formData.title || 'Event Title'}</h3>
                      <p className="event-description">{formData.description || 'Event description will appear here...'}</p>

                      <div className="event-info-grid">
                        <div className="event-info-item">
                          <span className="info-icon">📅</span>
                          <div className="info-text">
                            <span className="info-label">Date</span>
                            <span className="info-value">
                              {formData.date ? formatDate(formData.date) : 'Select date'}
                            </span>
                          </div>
                        </div>

                        <div className="event-info-item">
                          <span className="info-icon">🕒</span>
                          <div className="info-text">
                            <span className="info-label">Time</span>
                            <span className="info-value">{formData.time || 'Enter time'}</span>
                          </div>
                        </div>

                        <div className="event-info-item">
                          <span className="info-icon">📍</span>
                          <div className="info-text">
                            <span className="info-label">Venue</span>
                            <span className="info-value">{formData.venue || 'Enter venue'}</span>
                          </div>
                        </div>

                        <div className="event-info-item">
                          <span className="info-icon">👥</span>
                          <div className="info-text">
                            <span className="info-label">Capacity</span>
                            <span className="info-value">0 / {formData.maxParticipants}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
