import React, { useState } from "react";
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
  Switch,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
} from "@mui/material";
import {
  FiPlay as PlayCircleOutline,
  FiPlus as Add,
  FiEdit as Edit,
  FiTrash as Delete,
  FiZap as Bolt,
} from "react-icons/fi";

// Seed mock automations to make the workspace look alive and premium out of the box
const mockAutomations = [
  {
    id: "1",
    name: "Welcome Inbound Message Responder",
    description:
      "Auto-replies to any incoming client messages outside working hours.",
    trigger_type: "Inbound message received",
    is_active: true,
    execution_count: 142,
    last_executed_at: "2026-06-02T12:44:00Z",
  },
  {
    id: "2",
    name: "Tag Contact: Lead Creator",
    description:
      'Automatically assigns the "Lead" tag when a customer says "pricing".',
    trigger_type: 'Keyword match: "pricing"',
    is_active: true,
    execution_count: 58,
    last_executed_at: "2026-06-03T01:10:00Z",
  },
  {
    id: "3",
    name: "Broadcast Follow-up Wait Timer",
    description:
      "Fires webhook payload if user does not reply within 24 hours.",
    trigger_type: "Broadcast template delivered",
    is_active: false,
    execution_count: 12,
    last_executed_at: "2026-05-28T09:15:00Z",
  },
];

export default function Automations() {
  const [automations, setAutomations] = useState(mockAutomations);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("Inbound message received");

  const handleToggleActive = (id) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, is_active: !auto.is_active } : auto,
      ),
    );
  };

  const handleOpenDialog = () => {
    setName("");
    setDescription("");
    setTrigger("Inbound message received");
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleCreateAutomation = (e) => {
    e.preventDefault();
    if (!name) return;

    const newAuto = {
      id: Date.now().toString(),
      name,
      description,
      trigger_type: trigger,
      is_active: true,
      execution_count: 0,
      last_executed_at: null,
    };

    setAutomations((prev) => [newAuto, ...prev]);
    handleCloseDialog();
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
            Automations
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Configure visual rules to automatically reply and tag customers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
          sx={{ borderRadius: 2 }}
        >
          New Automation
        </Button>
      </Box>

      {/* Automations Table */}
      <Paper
        sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "background.paper" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Automation Rule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Trigger Event</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Executions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Executed</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {automations.map((auto) => (
                <TableRow key={auto.id} hover>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {auto.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                    >
                      {auto.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<Bolt sx={{ fontSize: "14px !important" }} />}
                      label={auto.trigger_type}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch
                        checked={auto.is_active}
                        onChange={() => handleToggleActive(auto.id)}
                        color="primary"
                        size="small"
                      />
                      <Typography
                        variant="caption"
                        color={auto.is_active ? "primary" : "text.secondary"}
                        sx={{ fontWeight: 700 }}
                      >
                        {auto.is_active ? "ACTIVE" : "INACTIVE"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{auto.execution_count}</TableCell>
                  <TableCell>
                    {auto.last_executed_at
                      ? new Date(auto.last_executed_at).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Automation Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create Automation Rule
        </DialogTitle>
        <form onSubmit={handleCreateAutomation}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              fullWidth
              label="Rule Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Out of office reply"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Trigger Event</InputLabel>
              <Select
                value={trigger}
                label="Trigger Event"
                onChange={(e) => setTrigger(e.target.value)}
              >
                <MenuItem value="Inbound message received">
                  Inbound message received
                </MenuItem>
                <MenuItem value='Keyword match: "pricing"'>
                  Keyword match
                </MenuItem>
                <MenuItem value="New contact added">New contact added</MenuItem>
                <MenuItem value="Scheduled time reached">
                  Scheduled cron timer
                </MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
