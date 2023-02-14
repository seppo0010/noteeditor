import { useContext, useEffect, useState } from "react";
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
  AppBarProps as MuiAppBarProps,
  TextField,
  Autocomplete,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Octokit } from "@octokit/rest";
import { UserContext } from "./user";
import { FileContext } from "./file";
import { LoginLogoutAvatar } from "./loginlogout";

const drawerWidth = 240;
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  marginRight: 10,
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
interface Repository {
  owner: string;
  name: string;
}

export default function Frame() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userContext = useContext(UserContext);
  if (userContext === null) {
    throw new Error("null user context");
  }
  const { user, setUser } = userContext;
  const fileContext = useContext(FileContext);
  if (fileContext === null) {
    throw new Error("null file context");
  }
  const { file, setFile } = fileContext;

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  useEffect(() => {
    if (!user.loggedIn) return;
    (async () => {
      setLoadingRepos(true);
      const octokit = new Octokit({ auth: user.loggedIn?.auth });
      setRepositories(
        (await octokit.paginate("GET /user/repos")).map((repo) => ({
          owner: repo.owner.login,
          name: repo.name,
        }))
      );
      setLoadingRepos(false);
    })();
  }, [user]);
  const [repositoryInputValue, setRepositoryInputValue] = useState("");

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
          <LoginLogoutAvatar user={user} setUser={setUser} />
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
          {user.loggedIn && !loadingRepos && repositories.length > 0 && (
            <Autocomplete
              getOptionLabel={(option) => `${option.owner}/${option.name}`}
              disablePortal
              options={repositories}
              value={file.repository}
              inputValue={repositoryInputValue}
              onInputChange={(event, newInputValue) => {
                setRepositoryInputValue(newInputValue);
              }}
              isOptionEqualToValue={(option, value) =>
                option.name === value.name && option.owner === value.owner
              }
              onChange={(event, newValue: Repository | null) => {
                setFile({
                  ...file,
                  repository: newValue === null ? undefined : newValue,
                });
              }}
              fullWidth
              renderInput={(params: any) => (
                <TextField {...params} label="Repository" />
              )}
            />
          )}
        </List>
      </Drawer>
    </>
  );
}
