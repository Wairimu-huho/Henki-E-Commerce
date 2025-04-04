import { useState, useEffect } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/profile", { withCredentials: true });
        setUser(data);
        setFormData({ name: data.name, email: data.email });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put("/api/profile", formData, { withCredentials: true });
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError("Please enter both current and new passwords.");
      return;
    }

    try {
      setLoading(true);
      await axios.put("/api/reset-password", passwordData, { withCredentials: true });
      setSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => setProfilePic(e.target.files[0]);

  const uploadProfilePicture = async () => {
    if (!profilePic) return;

    const formData = new FormData();
    formData.append("profilePicture", profilePic);

    try {
      setLoading(true);
      await axios.post("/api/profile/upload-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setSuccess("Profile picture updated!");
    } catch (err) {
      setError("Failed to upload picture.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProfilePicture = async () => {
    try {
      setLoading(true);
      await axios.delete("/api/profile/delete-picture", { withCredentials: true });
      setSuccess("Profile picture deleted.");
    } catch (err) {
      setError("Failed to delete picture.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      
      {user && (
        <>
          {/* Profile Picture */}
          <div className="mb-4">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="w-24 h-24 rounded-full" />
            ) : (
              <p>No profile picture</p>
            )}
            <input type="file" onChange={handleFileChange} className="mt-2" />
            <button onClick={uploadProfilePicture} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Upload</button>
            {user.profilePicture && (
              <button onClick={deleteProfilePicture} className="bg-red-500 text-white px-4 py-2 rounded ml-2">Delete</button>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block text-gray-700">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>

            <div className="mb-3">
              <label className="block text-gray-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>

            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Update Profile</button>
          </form>

          {/* Password Change */}
          <form onSubmit={handlePasswordChange} className="mt-4">
            <h3 className="text-lg font-bold">Change Password</h3>
            <div className="mb-3">
              <label className="block text-gray-700">Current Password</label>
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-3">
              <label className="block text-gray-700">New Password</label>
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full p-2 border rounded" required />
            </div>

            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded">Update Password</button>
          </form>

          {success && <p className="text-green-500 mt-3">{success}</p>}
        </>
      )}
    </div>
  );
};

export default Profile;
