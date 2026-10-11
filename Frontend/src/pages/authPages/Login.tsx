import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { login } from '@/store/userSlice';
import { handleErrorMessage } from '@/lib/utils';
import { loginUser } from '@/services/authServices';
import CustomButton from '@/components/shared/CustomButton';
import FormInputField from '@/components/shared/FormInputField';
import { loginSchema, type LoginValues } from '@/lib/authValidation';
import AuthFormContainer from '@/components/shared/AuthFormContainer';

/** Login page. Validates with the zod `loginSchema`;
 * the mutation shows errors;
 * on success the session is stored and `PublicRoute` sends the user to `/app`.
 */
const Login = () => {
  const dispatch = useDispatch();

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (session) => {
      dispatch(login(session));
    },
    onError: (err) => {
      toast.error(handleErrorMessage(err, 'Incorrect email or password'));
    },
  });

  const onSubmit = (values: LoginValues) => mutate(values);

  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthFormContainer
      title="Login"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          No account yet? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <FormInputField
        type="email"
        name="email"
        label="Email"
        control={control}
        autoComplete="email"
        placeholder="you@example.com"
      />
      <FormInputField
        type="password"
        name="password"
        label="Password"
        control={control}
        autoComplete="current-password"
        placeholder="Enter your password"
      />
      <CustomButton
        type="submit"
        isLoading={isPending}
        loadingText="Logging in..."
      >
        Login
      </CustomButton>
    </AuthFormContainer>
  );
};

export default Login;
