/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  UserPlus, 
  Calendar,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Member } from '../types';

interface MemberManagementProps {
  members: Member[];
  onAdd: (member: Omit<Member, 'id' | 'joiningDate' | 'status'>) => void;
  onEdit: (id: string, member: Partial<Member>) => void;
  onDelete: (id: string) => void;
}

export default function MemberManagement({ 
  members, 
  onAdd, 
  onEdit, 
  onDelete 
}: MemberManagementProps) {

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [familyMembers, setFamilyMembers] = useState(3);

  // Handle Add Form Submission
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !flatNo || !phone || !email) {
      alert('Please fill out all required fields');
      return;
    }
    onAdd({
      name,
      flatNo,
      phone,
      email,
      address,
      familyMembers: Number(familyMembers)
    });
    setIsAddOpen(false);
    resetForm();
  };

  // Handle Edit Form Submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    onEdit(editingMember.id, {
      name,
      flatNo,
      phone,
      email,
      address,
      familyMembers: Number(familyMembers),
    });
    setEditingMember(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setFlatNo('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFamilyMembers(3);
  };

  const startEdit = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setFlatNo(m.flatNo);
    setPhone(m.phone);
    setEmail(m.email);
    setAddress(m.address);
    setFamilyMembers(m.familyMembers);
  };

  const filtered = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.flatNo.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'All') return matchesSearch;
    return matchesSearch && m.status === filterStatus;
  });

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#3F6212] tracking-tight">Society Members</h2>
          <p className="text-xs text-[#3F6212]">Manage permanent residents directory, room assignments, active billing accounts</p>
        </div>
        <button
          id="add-member-trigger"
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Onboard New Resident</span>
        </button>
      </div>

      {/* Control Tools Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            id="member-search-input"
            type="text"
            placeholder="Search by name, flat, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          {(['All', 'Active', 'Inactive'] as const).map((status) => (
            <button
              id={`filter-status-${status}`}
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 md:flex-initial text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === status 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {status} Holders
            </button>
          ))}
        </div>
      </div>

      {/* Table / Grid list */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-450 font-mono text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Resident details</th>
                <th className="px-6 py-4">Flat #</th>
                <th className="px-6 py-4">Contact coordinates</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Billing Status</th>
                <th className="px-6 py-4 text-center">Interactive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs">
                        {member.name.trim().split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'RM'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">{member.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">{member.id} • {member.familyMembers} Family Members</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md font-mono font-bold">
                      {member.flatNo}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                      <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                      <Mail className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                      <span className="truncate max-w-[150px]">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1 text-[11px] font-mono">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{member.joiningDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      id={`toggle-member-status-${member.id}`}
                      onClick={() => onEdit(member.id, { status: member.status === 'Active' ? 'Inactive' : 'Active' })}
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold select-none cursor-pointer tracking-tight transition-all ${
                        member.status === 'Active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' 
                          : 'bg-rose-50 dark:bg-rose-955/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <span>{member.status}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        id={`btn-info-${member.id}`}
                        onClick={() => setSelectedMember(member)}
                        className="p-1 px-2 text-[10px] font-bold text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center space-x-1 cursor-pointer"
                        title="View Full Profile"
                      >
                        <Info className="h-3 w-3" />
                        <span>Profile</span>
                      </button>
                      <button
                        id={`btn-edit-${member.id}`}
                        onClick={() => startEdit(member)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        id={`btn-delete-${member.id}`}
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                            onDelete(member.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                        title="Remove Member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="text-xs">No matching society members found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Resident Dialog */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-add-modal"
              onClick={() => setIsAddOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              <span>Resident Registration Form</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Please enter verified flat coordinates and primary phone contact below.</p>
            
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    id="add-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Flat Assignment *</label>
                  <input
                    id="add-flat"
                    type="text"
                    required
                    placeholder="e.g. B-204"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    id="add-phone"
                    type="text"
                    required
                    placeholder="+91 99999 88888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Coordinates *</label>
                  <input
                    id="add-email"
                    type="email"
                    required
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Family Members Count</label>
                <input
                  id="add-family-count"
                  type="number"
                  min="1"
                  max="12"
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Detailed Alternate Address</label>
                <textarea
                  id="add-address"
                  placeholder="Street and Sector location details"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="add-member-cancel"
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="add-member-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Register Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Dialog */}
      {editingMember && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
            <button 
              id="close-edit-modal"
              onClick={() => setEditingMember(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              <span>Update Resident Account Info</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Refine verified phone, email or flat allocations for {editingMember.name}.</p>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Flat Assignment</label>
                  <input
                    id="edit-flat"
                    type="text"
                    required
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    id="edit-phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Coordinates</label>
                  <input
                    id="edit-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Family Members Count</label>
                <input
                  id="edit-family-count"
                  type="number"
                  min="1"
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Detailed Alternate Address</label>
                <textarea
                  id="edit-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  id="edit-member-cancel"
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="edit-member-submit"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Update Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Detail Slideout Modal drawer */}
      {selectedMember && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white dark:bg-slate-900 h-full w-full max-w-md shadow-2xl p-6 relative flex flex-col justify-between border-l border-slate-100 dark:border-slate-800 animate-in slide-in-from-right duration-250">
            <div>
              <button 
                id="close-profile-slideout"
                onClick={() => setSelectedMember(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="mx-auto h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center text-lg uppercase shadow-sm border border-slate-100 dark:border-slate-800 mb-3">
                  {selectedMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{selectedMember.name}</h4>
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">{selectedMember.id} • Resident</p>
                
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 ${
                  selectedMember.status === 'Active' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-rose-50 dark:bg-rose-955/30 text-rose-700 dark:text-rose-400'
                }`}>
                  {selectedMember.status} Account
                </span>
              </div>

              {/* Resident fields */}
              <div className="space-y-4 py-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Flat Allocation & Address</span>
                    <span className="font-bold text-slate-900 dark:text-indigo-400 font-mono text-[13px]">{selectedMember.flatNo}</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedMember.address || 'Resident has not declared separate alternate delivery location.'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Primary Telephone Contact</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{selectedMember.phone}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">E-Mail Address</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{selectedMember.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] block">Society Onboarding Date</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">{selectedMember.joiningDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              id="profile-close-btn"
              onClick={() => setSelectedMember(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Close Profile View
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
