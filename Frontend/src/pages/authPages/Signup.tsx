import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { zodResolver } from '@hookform/resolvers/zod';
import { handleErrorMessage } from '@/lib/utils';
import { signupUser } from '@/services/authServices';
import CustomButton from '@/components/shared/CustomButton';
import FormInputField from '@/components/shared/FormInputField';
import AuthFormContainer from '@/components/shared/AuthFormContainer';
import { signupSchema, type SignupValues } from '@/lib/authValidation';

/** Sign-up page. Validates with the zod `signupSchema`;
 * the mutation shows errors;
 * on success no session is started and the user goes to `/login`.
 * */
const Signup = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: signupUser,
    onSuccess: () => {
      toast.success('Account created. Please login.');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      toast.error(handleErrorMessage(err, 'Signup failed'));
    },
  });

  const onSubmit = (values: SignupValues) => mutate(values);

  const { control, handleSubmit } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { email: '', name: '', password: '' },
  });

  return (
    <AuthFormContainer
      title="Create account"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          Already have an account? <Link to="/login">Login</Link>
        </>
      }
    >
      <FormInputField
        name="email"
        type="email"
        label="Email"
        control={control}
        autoComplete="email"
        placeholder="you@example.com"
      />
      <FormInputField
        name="name"
        type="text"
        label="Name"
        control={control}
        autoComplete="name"
        placeholder="Your full name"
      />
      <FormInputField
        name="password"
        type="password"
        label="Password"
        control={control}
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <CustomButton
        type="submit"
        isLoading={isPending}
        loadingText="Creating account..."
      >
        Sign up
      </CustomButton>
    </AuthFormContainer>
  );
};

export default Signup;
