import { Container, Typography, AppBar, Toolbar, makeStyles, Button } from '@material-ui/core';
import { Switch } from "react-router-dom";
import TodoList from './components/TodoList';
import { useAuth0 } from "@auth0/auth0-react";
import ProtectedRoute from "./components/ProtectedRoute";

const useStyles = makeStyles(theme => ({
  main: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  }
}));

function App() {

  const classes = useStyles();

  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  // if (isLoading) { return <Loading /> }

  // if (isAuthenticated) { console.log(user); };

  const AuthButton = () => {
    return isAuthenticated ?
      <Button variant="contained" color="secondary" onClick={() => logout()}>Log Out</Button> :
      <Button variant="contained" color="default" onClick={() => loginWithRedirect()}>Log In</Button>
  }

  const HomePage = () => {
    return (
      <>
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h6" style={{ flex: 1 }}>My Todos</Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>
        <Container fixed>
          <Toolbar />
          <main className={classes.main}>
            <TodoList />
          </main>
        </Container>
      </>
    )

  }

  return (
    <Switch>
      <ProtectedRoute path="/" exact component={HomePage} />
    </Switch>
  );
}

export default App;