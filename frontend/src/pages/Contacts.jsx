import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Typography, Button, IconButton, TextField, Dialog, 
  DialogTitle, DialogContent, DialogActions, Stack, Chip, CircularProgress 
} from '@mui/material';
import { PersonAdd, Search, Edit, Delete, Label } from '@mui/icons-material';
import api from '../lib/api.js';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contactsRes, tagsRes] = await Promise.all([
        api.get('/crm/contacts/'),
        api.get('/crm/tags/'),
      ]);
      setContacts(contactsRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      console.error("Error loading CRM contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setSelectedTags([]);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleToggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;

    const payload = {
      name,
      phone,
      email: email || null,
      company: company || null,
      tags: selectedTags,
    };

    try {
      const res = await api.post('/crm/contacts/', payload);
      setContacts(prev => [res.data, ...prev]);
      handleCloseDialog();
    } catch (err) {
      console.error("Error creating contact:", err);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api.delete(`/crm/contacts/${contactId}/`);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      console.error("Error deleting contact:", err);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const term = search.toLowerCase();
    const cName = contact.name?.toLowerCase() || '';
    const cPhone = contact.phone?.toLowerCase() || '';
    const cCompany = contact.company?.toLowerCase() || '';
    return cName.includes(term) || cPhone.includes(term) || cCompany.includes(term);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>CRM Contacts</Typography>
          <Typography variant="subtitle1" color="text.secondary">Manage your client catalog, tags, and details.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />} 
          onClick={handleOpenDialog}
          sx={{ borderRadius: 2 }}
        >
          Add Contact
        </Button>
      </Box>

      {/* Contacts Table Panel */}
      <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search contacts by name, phone or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 360 } }}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
            }}
          />
        </Box>
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredContacts.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No contacts found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{contact.name || 'Unnamed Contact'}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.company || '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {contact.tags_detail?.map((t) => (
                          <Chip 
                            key={t.id} 
                            label={t.name} 
                            size="small" 
                            sx={{ 
                              bgcolor: t.color, 
                              color: '#fff', 
                              fontWeight: 600,
                              fontSize: '11px' 
                            }} 
                          />
                        ))}
                        {(!contact.tags_detail || contact.tags_detail.length === 0) && (
                          <Typography variant="caption" color="text.secondary">No tags</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDeleteContact(contact.id)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Contact Modal Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create CRM Contact</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label="Contact Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +1234567890"
              required
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
            />
            <TextField
              fullWidth
              label="Company Name"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
            />

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Label color="action" fontSize="small" /> Tags Assignment
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 1 }}>
                {tags.map(t => {
                  const selected = selectedTags.includes(t.id);
                  return (
                    <Chip
                      key={t.id}
                      label={t.name}
                      onClick={() => handleToggleTag(t.id)}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{
                        bgcolor: selected ? t.color : 'transparent',
                        borderColor: t.color,
                        color: selected ? '#fff' : t.color,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: selected ? t.color : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    />
                  );
                })}
                {tags.length === 0 && (
                  <Typography variant="caption" color="text.secondary">No tags configured in CRM.</Typography>
                )}
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Create Contact</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
