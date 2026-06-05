import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import {
  FiGitBranch as AccountTree,
  FiCheck as CheckCircle,
  FiChevronRight as ChevronRight,
  FiCpu as Extension,
} from "react-icons/fi";

export default function Flows() {
  const steps = [
    {
      title: "WhatsApp Trigger Node",
      desc: 'Triggers when a new customer initiates a WhatsApp chat with keyword "hello".',
      type: "Trigger",
      color: "#10b981",
    },
    {
      title: "Wait Node",
      desc: "Wait for exactly 5 minutes before replying to mimic human speed.",
      type: "Delay",
      color: "#8b5cf6",
    },
    {
      title: "Conditional Branch",
      desc: 'Check if the contact contains the tag "Existing Customer".',
      type: "Condition",
      color: "#f59e0b",
    },
    {
      title: "Send Reply template",
      desc: "Fires the customized approved greeting template dynamically.",
      type: "Action",
      color: "#2563eb",
    },
  ];

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Visual Automation Flows
            </Typography>
            <Box
              sx={{
                bgcolor: "warning.main",
                color: "warning.contrastText",
                px: 1.5,
                py: 0.25,
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
              }}
            >
              BETA
            </Box>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Build step-by-step visual trees to manage WhatsApp message replies.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AccountTree />}
          sx={{ borderRadius: 2 }}
        >
          Launch Visual Builder
        </Button>
      </Box>

      {/* Visual Canvas Demo */}
      <Paper
        sx={{
          p: 4,
          minHeight: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid",
          borderColor: "divider",
          background: "radial-gradient(#334155 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
        >
          {steps.map((step, idx) => (
            <React.Fragment key={step.title}>
              {idx > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    transform: { xs: "rotate(90deg)", md: "none" },
                  }}
                >
                  <ChevronRight
                    sx={{ color: "text.secondary", fontSize: 32 }}
                  />
                </Box>
              )}

              <Card
                sx={{
                  width: 220,
                  border: "2px solid",
                  borderColor: step.color,
                  bgcolor: "background.paper",
                  position: "relative",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Chip
                      label={step.type.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: step.color,
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "9px",
                        height: 18,
                      }}
                    />
                    <Extension sx={{ fontSize: 16, color: step.color }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                    {step.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", lineHeight: 1.4 }}
                  >
                    {step.desc}
                  </Typography>
                </CardContent>
              </Card>
            </React.Fragment>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
