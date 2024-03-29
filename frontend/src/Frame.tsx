import { useContext, useRef, useState } from "react";
import "./App.css";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism.css";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from "@mui/icons-material/Save";
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
  Popover,
  Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { UserContext } from "./user";
import { LoginLogoutAvatar } from "./loginlogout";
import { Repository } from "./repository";
import SearchResults from "./SearchResults";
import { useAsync } from "react-use";
import { useHotkeys } from "react-hotkeys-hook";
import { SearchContext } from "./SearchProvider";
import { FileContext } from "./file";
import { ActionContext } from "./Action";

const drawerWidth = 240;
const SearchDiv = styled("div")(({ theme }) => ({
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

function Search() {
  const [searchCriteria, setSearchCriteria] = useState("");
  const searchInputRef = useRef<HTMLElement | null>(null);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const { search } = useContext(SearchContext)!;
  const searchResults = useAsync(async () => {
    return search.searchWorker.search(searchCriteria);
  }, [searchCriteria, search]);

  useHotkeys(
    "meta+/",
    () => {
      searchInputRef?.current?.focus();
    },
    { enableOnFormTags: true },
    [searchInputRef]
  );

  return (
    <SearchDiv>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Search…"
        inputProps={{ "aria-label": "search" }}
        inputRef={searchInputRef}
        onFocus={() => setSearchResultsOpen(true)}
        onBlur={() => setSearchResultsOpen(false)}
        value={searchCriteria}
        onChange={(event) => setSearchCriteria(event.target.value)}
      />
      {searchCriteria !== "" && (
        <Popover
          className="searchResults"
          open={searchResultsOpen}
          onClose={() => setSearchResultsOpen(false)}
          disableAutoFocus={true}
          disableEnforceFocus={true}
          anchorEl={searchInputRef?.current}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <SearchResults
            {...searchResults}
            onDone={() => {
              setSearchCriteria("");
              setSearchResultsOpen(false);
              searchInputRef?.current?.blur();
            }}
          />
        </Popover>
      )}
    </SearchDiv>
  );
}

export default function Frame() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, setUser } = useContext(UserContext)!;
  const { file, setFile, saving } = useContext(FileContext)!;
  const { callback } = useContext(ActionContext)!;

  useHotkeys(
    "esc",
    () => {
      setDrawerOpen(false);
    },
    { enableOnFormTags: true }
  );

  return (
    <>
      <AppBar position="static" className="appbar" drawerOpen={drawerOpen}>
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
            noteeditor{file.path ? ` - ${file.path}` : ``}
          </Typography>
          <Search />
          <Tooltip
            title={
              file.path
                ? saving
                  ? "Saving..."
                  : `Save ${file.path}`
                : "No file selected"
            }
          >
            <IconButton
              onClick={() => callback && callback({ type: "save" })}
              disabled={saving || !file.path}
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton
              onClick={() => callback && callback({ type: "pdf" })}
            >
              <PictureAsPdfIcon />
            </IconButton>
          </Tooltip>
          <LoginLogoutAvatar user={user} setUser={setUser} setFile={setFile} />
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
          <Repository onClose={() => setDrawerOpen(false)} />
        </List>
      </Drawer>
    </>
  );
}
