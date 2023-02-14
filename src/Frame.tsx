import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import "./App.css";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import {
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBarProps as MuiAppBarProps,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Link,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Octokit } from "@octokit/rest";
import { UserContext, UserOpt } from "./user";
const drawerWidth = 240;
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

interface AppBarProps extends MuiAppBarProps {
  drawerOpen?: boolean;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "drawerOpen",
})<AppBarProps>(({ theme, drawerOpen }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(drawerOpen && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

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
          <Button onClick={close}>Cancel</Button>
          <Button
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

export default function Frame() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginToGitHubOpen, setLoginToGitHubOpen] = useState(false);
  const userContext = useContext(UserContext);
  if (userContext === null) {
    throw new Error("null user context");
  }
  const { user, setUser } = userContext;

  return (
    <>
      <AppBar position="static" drawerOpen={drawerOpen}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            noteeditor
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
            />
          </Search>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={drawerOpen}
      >
        <DrawerHeader>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {user.loggedIn === undefined && (
            <ListItem disablePadding>
              <ListItemButton onClick={() => setLoginToGitHubOpen(true)}>
                <ListItemIcon>
                  <GitHubIcon />
                </ListItemIcon>
                <ListItemText primary="Login to GitHub" />
              </ListItemButton>
            </ListItem>
          )}
        </List>
        <LoginToGitHub
          isOpen={loginToGitHubOpen}
          close={() => setLoginToGitHubOpen(false)}
          setUser={setUser}
        />
      </Drawer>
    </>
  );
}
