import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  FiSend as Send,
  FiVolume2 as Campaign,
  FiVolume2 as CampaignOutlined,
  FiStar as Star,
} from "react-icons/fi";
import api from "../lib/api.js";

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [broadcastsRes, templatesRes] = await Promise.all([
        api.get("/crm/broadcasts/"),
        api.get("/crm/templates/"),
      ]);
      setBroadcasts(broadcastsRes.data);
      setTemplates(templatesRes.data);
    } catch (err) {
      console.error("Error fetching broadcasts data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setName("");
    setSelectedTemplate("");
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!name || !selectedTemplate) return;

    const templateObj = templates.find((t) => t.id === selectedTemplate);

    const payload = {
      name,
      template_name: templateObj?.name || "template_placeholder",
      template_language: templateObj?.language || "en_US",
      status: "draft",
    };

    try {
      const res = await api.post("/crm/broadcasts/", payload);
      setBroadcasts((prev) => [res.data, ...prev]);
      handleCloseDialog();
    } catch (err) {
      console.error("Error creating broadcast:", err);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case "sent":
        return "success";
      case "sending":
        return "info";
      case "scheduled":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Broadcast Campaigns
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Send bulk messages using Meta-approved WhatsApp templates.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Campaign />}
          onClick={handleOpenDialog}
          sx={{ borderRadius: 2 }}
        >
          New Broadcast
        </Button>
      </Box>

      {/* Broadcasts Table Panel */}
      <Paper
        sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : broadcasts.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CampaignOutlined sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              No broadcasts sent yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "background.paper" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Campaign Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Meta Template</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Delivered / Read
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Date Created
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {broadcasts.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{b.name}</TableCell>
                    <TableCell>{b.template_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={b.status.toUpperCase()}
                        size="small"
                        color={getStatusChipColor(b.status)}
                        sx={{ fontWeight: 700, fontSize: "10px" }}
                      />
                    </TableCell>
                    <TableCell>{b.total_recipients || 0}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`Delivered: ${b.delivered_count || 0}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`Read: ${b.read_count || 0}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {new Date(b.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Broadcast Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          New Broadcast Campaign
        </DialogTitle>
        <form onSubmit={handleCreateBroadcast}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              fullWidth
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. June Newsletter"
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Meta Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Meta Template"
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </MenuItem>
                ))}
                {templates.length === 0 && (
                  <MenuItem disabled>
                    No approved templates found in Meta account.
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" endIcon={<Send />}>
              Launch
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
