import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Switch,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  FiSave as Save,
  FiSettings as SettingsApplications,
  FiCheck as Done,
  FiX as Close,
  FiHelpCircle as HelpOutline,
} from "react-icons/fi";
import api from "../lib/api.js";

export default function Settings() {
  // WhatsApp Meta configurations state
  const [configId, setConfigId] = useState(null);
  const [phoneId, setPhoneId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get("/crm/configs/");
      if (res.data.length > 0) {
        const item = res.data[0];
        setConfigId(item.id);
        setPhoneId(item.phone_number_id);
        setWabaId(item.waba_id || "");
        setAccessToken(item.access_token);
        setVerifyToken(item.verify_token || "");
      }
    } catch (err) {
      console.error("Error loading configs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: "", text: "" });

    const payload = {
      phone_number_id: phoneId,
      waba_id: wabaId || null,
      access_token: accessToken,
      verify_token: verifyToken || null,
    };

    try {
      if (configId) {
        await api.put(`/crm/configs/${configId}/`, payload);
      } else {
        const res = await api.post("/crm/configs/", payload);
        setConfigId(res.data.id);
      }
      setStatusMsg({
        type: "success",
        text: "WhatsApp Business configuration saved successfully!",
      });
    } catch (err) {
      console.error("Error saving WhatsApp config:", err);
      setStatusMsg({
        type: "error",
        text: "Failed to save configuration. Please review token details.",
      });
    } finally {
      setSaving(false);
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
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Account Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure Meta Cloud credentials and webhook verification endpoints.
        </Typography>
      </Box>

      {statusMsg.text && (
        <Alert severity={statusMsg.type} sx={{ mb: 4, borderRadius: 2 }}>
          {statusMsg.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, border: "1px solid", borderColor: "divider" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <SettingsApplications /> WhatsApp Meta Config
            </Typography>
            <Divider sx={{ mb: 4 }} />

            <form onSubmit={handleSaveConfig}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number ID"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="e.g. 104523912952"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="WhatsApp Business Account ID"
                      value={wabaId}
                      onChange={(e) => setWabaId(e.target.value)}
                      placeholder="e.g. 941042302391"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="System User Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Paste your long-lived Meta developer system token"
                  multiline
                  rows={2}
                  required
                />

                <TextField
                  fullWidth
                  label="Webhook Verification Token"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                  placeholder="Define your security string to verify Meta challenge"
                />

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      saving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Save />
                      )
                    }
                    disabled={saving}
                    sx={{ px: 4 }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{ border: "1px solid", borderColor: "divider", height: "100%" }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Integration Support
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, lineHeight: 1.6 }}
              >
                To receive real-time messages from Meta, configure your WhatsApp
                Webhook fields on the Facebook Developer portal to point to this
                address:
              </Typography>
              <Paper
                sx={{ p: 2, bgcolor: "action.hover", border: "none", mb: 3 }}
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, wordBreak: "break-all" }}
                >
                  http://&lt;your-domain&gt;/api/v1/crm/whatsapp/webhook/
                </Typography>
              </Paper>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontWeight: 700,
                }}
              >
                <HelpOutline fontSize="small" /> Need assistance?
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Ensure your Webhook Verification Token matches the field on the
                portal exactly.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
