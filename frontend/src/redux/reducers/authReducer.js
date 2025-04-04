// Initial state
const initialState = {
    isAuthenticated: false,
    token: null,
    user: null,
    loading: false,
    error: null
  };
  
  // Auth Reducer
  const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'AUTH_LOGIN_REQUEST':
        return {
          ...state,
          loading: true,
          error: null
        };
      
      case 'AUTH_LOGIN_SUCCESS':
        return {
          ...state,
          isAuthenticated: true,
          token: action.payload.token,
          user: action.payload.user,
          loading: false,
          error: null
        };
      
      case 'AUTH_LOGIN_FAILURE':
        return {
          ...state,
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false,
          error: action.payload
        };
      
      case 'AUTH_LOGOUT':
        return {
          ...state,
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false,
          error: null
        };
      
      case 'AUTH_LOAD_USER':
        return {
          ...state,
          isAuthenticated: !!action.payload.token,
          token: action.payload.token
        };
      
      default:
        return state;
    }
  };
  
  export default authReducer;