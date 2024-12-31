import { Router } from 'express';
import { 
  activateUser, 
  getUserInfo, 
  loginUser, 
  logoutUser, 
  registerUser, 
  socialAuth, 
  updateAccessToken,
  updateProfilePicture,
  updateUserInfo,
  updateUserPassword
} from '../controllers/user.controller';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/register', registerUser);

router.post('/activate-user', activateUser);

router.post('/login', loginUser);

router.get("/logout",isAuthenticated, logoutUser)

router.get("/refresh-token",updateAccessToken)

router.get("/me",isAuthenticated,getUserInfo)

router.post("/social-auth",socialAuth)
 
router.put("/update-info",isAuthenticated,updateUserInfo)

router.put("/update-password",isAuthenticated,updateUserPassword)

router.put("/update-avatar",isAuthenticated,updateProfilePicture)


export default router;