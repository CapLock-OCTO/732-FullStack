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

  if (isLoading) { return <Loading /> }

  if (!isAuthenticated) { loginWithRedirect() };

  const AuthButton = () => {
    return isAuthenticated ? 
              <Button variant="contained" color="secondary" onClick={()=>logout()}>Logout</Button> : 
              <Button variant="contained" color="default" onClick={()=>loginWithRedirect()}>Login In</Button>
  }

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" style={{flex:1}}>My Todos</Typography>
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