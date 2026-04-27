import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar className="app-navbar" expand="lg">
      <Container>
        <Navbar.Brand className="app-navbar__brand">Guestly</Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          {user && (
            <Nav className="me-auto">
              {user.role === 'guest' && (
                <>
                  <Nav.Link as={NavLink} to="/guest/book" className="text-white">Book a Table</Nav.Link>
                  <Nav.Link as={NavLink} to="/guest/reservations" className="text-white">My Reservations</Nav.Link>
                </>
              )}
              {user.role === 'host' && (
                <>
                  <Nav.Link as={NavLink} to="/host/dashboard" className="text-white">Dashboard</Nav.Link>
                  <Nav.Link as={NavLink} to="/host/walkin" className="text-white">Walk-In</Nav.Link>
                  <Nav.Link as={NavLink} to="/host/reservations" className="text-white">All Reservations</Nav.Link>
                </>
              )}
            </Nav>
          )}
          {user && (
            <div className="d-flex align-items-center gap-3">
              <Badge className="role-badge" bg={user.role === 'host' ? 'warning' : 'info'} text="dark">
                {user.role.toUpperCase()}
              </Badge>
              <span className="app-navbar__username">{user.username}</span>
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
