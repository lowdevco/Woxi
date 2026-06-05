import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
} from "@mui/material";
import { FiPlus as Add, FiUser as AccountCircle } from "react-icons/fi";
import { FaRupeeSign as RupeeIcon } from "react-icons/fa";
import api from "../lib/api.js";

export default function Pipelines() {
  const [pipeline, setPipeline] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Deal Dialog
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [selectedContact, setSelectedContact] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pipelines and contacts
      const [pipesRes, contactsRes] = await Promise.all([
        api.get("/crm/pipelines/"),
        api.get("/crm/contacts/"),
      ]);

      setContacts(contactsRes.data);

      if (pipesRes.data.length > 0) {
        // Load the first pipeline
        setPipeline(pipesRes.data[0]);
      } else {
        // Automatically seed an initial pipeline if none exist
        const newPipe = await api.post("/crm/pipelines/", {
          name: "Sales Pipeline",
        });

        // Seed standard pipeline stages
        const stage1 = await api.post("/crm/stages/", {
          pipeline: newPipe.data.id,
          name: "Lead",
          position: 1,
          color: "#3b82f6",
        });
        const stage2 = await api.post("/crm/stages/", {
          pipeline: newPipe.data.id,
          name: "Contacted",
          position: 2,
          color: "#f59e0b",
        });
        const stage3 = await api.post("/crm/stages/", {
          pipeline: newPipe.data.id,
          name: "Proposal Sent",
          position: 3,
          color: "#8b5cf6",
        });
        const stage4 = await api.post("/crm/stages/", {
          pipeline: newPipe.data.id,
          name: "Negotiation",
          position: 4,
          color: "#ec4899",
        });
        const stage5 = await api.post("/crm/stages/", {
          pipeline: newPipe.data.id,
          name: "Won",
          position: 5,
          color: "#10b981",
        });

        const seededPipe = await api.get(`/crm/pipelines/${newPipe.data.id}/`);
        setPipeline(seededPipe.data);
      }
    } catch (err) {
      console.error("Error loading sales pipelines:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (stageId) => {
    setTitle("");
    setValue("");
    setSelectedContact("");
    setSelectedStage(stageId);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!title || !selectedContact || !selectedStage || !pipeline) return;

    const payload = {
      pipeline: pipeline.id,
      stage: selectedStage,
      contact: selectedContact,
      title,
      value: parseFloat(value) || 0,
      status: "active",
    };

    try {
      const res = await api.post("/crm/deals/", payload);
      // Reload pipeline to fetch populated nested objects
      const pipeReload = await api.get(`/crm/pipelines/${pipeline.id}/`);
      setPipeline(pipeReload.data);
      handleCloseDialog();
    } catch (err) {
      console.error("Error creating deal:", err);
    }
  };

  // Drag and Drop implementation using standard HTML5 DnD
  const onDragStart = (e, dealId) => {
    e.dataTransfer.setData("dealId", dealId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStageId) => {
    const dealId = e.dataTransfer.getData("dealId");
    if (!dealId || !pipeline) return;

    // Locate the deal
    const dealObj = pipeline.deals?.find((d) => d.id === dealId);
    if (!dealObj || dealObj.stage === targetStageId) return;

    // Optimistically update locally
    setPipeline((prev) => {
      const updatedDeals = prev.deals?.map((d) =>
        d.id === dealId ? { ...d, stage: targetStageId } : d,
      );
      return { ...prev, deals: updatedDeals };
    });

    try {
      // Patch stage changes to DRF
      await api.patch(`/crm/deals/${dealId}/`, { stage: targetStageId });

      // Force reload to get perfect server consistency
      const pipeReload = await api.get(`/crm/pipelines/${pipeline.id}/`);
      setPipeline(pipeReload.data);
    } catch (err) {
      console.error("Error updating deal stage:", err);
      // Revert reload on error
      const pipeReload = await api.get(`/crm/pipelines/${pipeline.id}/`);
      setPipeline(pipeReload.data);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Deals Pipeline
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Kanban pipeline of active client sales and deals.
          </Typography>
        </Box>
      </Box>

      {/* Kanban Board Container */}
      <Box
        sx={{ flexGrow: 1, overflowX: "auto", display: "flex", gap: 3, pb: 2 }}
      >
        {pipeline?.stages?.map((stage) => {
          // Filter deals belonging to this stage
          const stageDeals =
            pipeline.deals?.filter((deal) => deal.stage === stage.id) || [];
          const stageTotalValue = stageDeals.reduce(
            (sum, deal) => sum + parseFloat(deal.value || 0),
            0,
          );

          return (
            <Box
              key={stage.id}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, stage.id)}
              sx={{
                minWidth: 280,
                maxWidth: 320,
                flexGrow: 1,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.03)"
                    : "#f1f5f9",
                borderRadius: 3,
                p: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Stage Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: stage.color,
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {stage.name}
                  </Typography>
                  <Chip
                    label={stageDeals.length}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(stage.id)}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Box>

              {/* Total Value */}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, display: "block", mb: 2 }}
              >
                Total: ₹$
                {stageTotalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Typography>

              {/* Deals List */}
              <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto" }}>
                {stageDeals.map((deal) => (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, deal.id)}
                    sx={{
                      cursor: "grab",
                      "&:active": { cursor: "grabbing" },
                      border: "1px solid",
                      borderColor: "divider",
                      boxShadow: "0 1px 2px rgb(0 0 0 / 0.03)",
                      transition: "transform 0.15s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, mb: 1.5 }}
                      >
                        {deal.title}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: "primary.light",
                            fontSize: 10,
                          }}
                        >
                          {deal.contact_detail?.name
                            ?.substring(0, 1)
                            .toUpperCase() || (
                            <AccountCircle sx={{ fontSize: 12 }} />
                          )}
                        </Avatar>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          {deal.contact_detail?.name ||
                            deal.contact_detail?.phone}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            color: "success.main",
                            gap: 0.5,
                          }}
                        >
                          <RupeeIcon style={{ fontSize: 13 }} />{" "}
                          {parseFloat(deal.value || 0).toLocaleString()}
                        </Typography>
                        <Chip
                          label="WhatsApp"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 16, fontSize: 8, fontWeight: 700 }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Create Deal Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Deal</DialogTitle>
        <form onSubmit={handleCreateDeal}>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              fullWidth
              label="Deal Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme Enterprise Deal"
              required
            />
            <TextField
              fullWidth
              label="Deal Value (INR)"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 5000"
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Contact Client</InputLabel>
              <Select
                value={selectedContact}
                label="Contact Client"
                onChange={(e) => setSelectedContact(e.target.value)}
              >
                {contacts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name || c.phone} ({c.phone})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create Deal
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
