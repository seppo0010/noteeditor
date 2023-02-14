import React, { Dispatch, SetStateAction, useState } from "react";
import "./App.css";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import IconButton from "@mui/material/IconButton";
import {
  ListItemIcon,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Link,
  CircularProgress,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import { Octokit } from "@octokit/rest";
import { UserContextInterface, UserOpt } from "./user";
import { Logout } from "@mui/icons-material";

function LoginToGitHub({
  isOpen,
  close,
  setUser,
}: {
  isOpen: boolean;
  close: () => void;
  setUser: Dispatch<SetStateAction<UserOpt>>;
}) {
  const [pat, setPAT] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(auth: string): Promise<void> {
    setLoading(true);
    try {
      const octokit = new Octokit({ auth });
      const user = await octokit.rest.users.getAuthenticated();
      setUser({ loggedIn: { auth, avatar: user.data.avatar_url } });
      setError("");
      setPAT("");
      close();
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Unexpected errror");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Login to GitHub</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Access GitHub using a Personal Access Token.{" "}
            <Link
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              Create one
            </Link>{" "}
            and paste it below. It needs access to only the repositories you
            want to use, and contents read (and optionally write).
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Personal Access Token"
            type="password"
            value={pat}
            onChange={(event) => setPAT(event.target.value)}
            fullWidth
            variant="standard"
            error={error !== ""}
            helperText={error}
            disabled={loading}
          />
          {loading && <CircularProgress />}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={loading}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              login(pat);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function LoginLogoutAvatar({ user, setUser }: UserContextInterface) {
  const [
    accountSettingsAnchorEl,
    setAccountSettingsAnchorEl,
  ] = React.useState<null | HTMLElement>(null);
  const [loginToGitHubOpen, setLoginToGitHubOpen] = useState(false);
  return user.loggedIn?.avatar ? (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={(event) => setAccountSettingsAnchorEl(event?.currentTarget)}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={
            accountSettingsAnchorEl !== null ? "account-menu" : undefined
          }
          aria-haspopup="true"
          aria-expanded={accountSettingsAnchorEl !== null ? "true" : undefined}
        >
          <Avatar alt="You" src={user.loggedIn.avatar} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={accountSettingsAnchorEl}
        open={accountSettingsAnchorEl !== null}
        onClose={() => setAccountSettingsAnchorEl(null)}
        onClick={() => setAccountSettingsAnchorEl(null)}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            setUser({ ...user, loggedIn: undefined });
            setAccountSettingsAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  ) : (
    <>
      <Tooltip title="Login">
        <IconButton
          onClick={() => setLoginToGitHubOpen(true)}
          size="small"
          sx={{ ml: 2 }}
          aria-haspopup="true"
          aria-expanded={loginToGitHubOpen ? "true" : undefined}
        >
          <Avatar />
        </IconButton>
      </Tooltip>
      <LoginToGitHub
        isOpen={loginToGitHubOpen}
        close={() => setLoginToGitHubOpen(false)}
        setUser={setUser}
      />
    </>
  );
}
