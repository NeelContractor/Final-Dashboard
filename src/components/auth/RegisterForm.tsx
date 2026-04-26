import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { register } from "../../services/authService";
import { tokenStorage } from "../../utils/tokenStorage";
import CloudinaryUploadWidget from "../../ImageUpload";

// TODO: i have added upload image logic here, check it once
// TODO: after registation is successed redirst user to /signin page
// const UW_CONFIG: Record<string, unknown> = {
//   cloudName:            import.meta.env.VITE_CLOUD_NAME ?? '',
//   uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET ?? '',
//   multiple:             false,
//   clientAllowedFormats: ['image'],
// };

interface FormData {
  name:           string;
  email:          string;
  mobile:         string;
  username:       string;
  password:       string;
  image:         string;
}

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const UW_CONFIG = useMemo(() => ({
    cloudName:            import.meta.env.VITE_CLOUD_NAME,
    uploadPreset:         import.meta.env.VITE_UPLOAD_PRESET,
    multiple:             false,
    clientAllowedFormats: ['image'],
  }), []); // empty deps — env vars never change at runtime

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    mobile: "",
    username: "",
    password: "",
    image: "",
  });

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleProfileImageUpload = useCallback((url: string) => {
    setFormData(prev => ({ ...prev, image: url }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isChecked) {
      setError("You must agree to the Terms and Conditions.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await register({
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        username: formData.username,
        password: formData.password,
        image: formData.image,
      });
      console.log(response)

      const token = response?.data?.token;

      if (token) {
        tokenStorage.set(token);
        navigate("/");
      } else {
        setError("Registration succeeded but no token received.");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      {/* <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div> */}

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Register
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create an account!
            </p>
          </div>

          <div>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-5">

                <div>
                  <Label>Name<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Email<span className="text-error-500">*</span></Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Mobile<span className="text-error-500">*</span></Label>
                  <Input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Username<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Password<span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>Profile Image URL</Label>
                  {/* <Input
                    type="url"
                    id="image"
                    name="image"
                    placeholder="https://example.com/your-photo.jpg"
                    value={formData.image}
                    onChange={handleChange}
                  /> */}
                  <CloudinaryUploadWidget uwConfig={UW_CONFIG} onUpload={handleProfileImageUpload} />
                    {formData.image && (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        <img src={formData.image} alt="Main preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => update('image', '')}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                        >✕</button>
                      </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">Terms and Conditions,</span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">Privacy Policy</span>
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating account..." : "Register"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}