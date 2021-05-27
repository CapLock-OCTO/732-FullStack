import { Container, Typography, AppBar, Toolbar, makeStyles, Button } from '@material-ui/core';
import TodoList from './components/TodoList';
import { useAuth0 } from "@auth0/auth0-react";
import Loading from './components/loading';

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

  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();

  if (isLoading) {
    return <Loading />
  }

  const AuthButton = () => {
    return isAuthenticated ? 
              <button onClick={()=>logout()}>Logout</button> : 
              <button onClick={()=>loginWithRedirect()}>Login In</button>
  }

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">My Todos</Typography>
          <AuthButton/>
        </Toolbar>
      </AppBar>
      <Container fixed>
        <Toolbar />
        <main className={classes.main}>
          <TodoList />
        </main>
      </Container>
    </>
  );
}

export default App;