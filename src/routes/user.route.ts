import { Router } from 'express';
import { 
  activateUser, 
  deleteUser, 
  deleteUserByOwn, 
  getAllUsers, 
  getUserInfo, 
  loginUser, 
  logoutUser, 
  registerUser, 
  socialAuth, 
  updateAccessToken,
  updateProfilePicture,
  updateUserInfo,
  updateUserPassword,
  updateUserRole
} from '../controllers/user.controller';
import { authorizedRole, isAuthenticated } from '../middleware/auth';

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

router.get("/get-all-users",isAuthenticated,authorizedRole("admin"),getAllUsers)

router.put("/update-user-role",isAuthenticated,authorizedRole("admin"),updateUserRole)

// delete user by own
router.delete("/delete-user-own",isAuthenticated,deleteUserByOwn)

router.delete("/delete-user/:id",isAuthenticated,authorizedRole("admin"),deleteUser)





export default router;