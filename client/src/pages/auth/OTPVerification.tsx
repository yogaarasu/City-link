"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Loader } from "lucide-react";
import { AUTHORIZE } from "@/utils/constants";
import { useUserState } from "@/store/user.store";
import type { IUser } from "@/types/user";

const SIGNUP_OTP_SESSION_KEY = "citylink:signup-otp-email";

export function OtpVerification({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();
	const location = useLocation();
	const [otp, setOtp] = useState("");
	const [seconds, setSeconds] = useState(60);
	const [isResending, setIsResending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [searchParams] = useSearchParams();
	const isAuthorized = location.state?.isAuthorized;
	const email = String(searchParams.get("email") || "").trim().toLowerCase();
	const setAuthSession = useUserState((state) => state.setAuthSession);

	useEffect(() => {
		const storedEmail = String(sessionStorage.getItem(SIGNUP_OTP_SESSION_KEY) || "")
			.trim()
			.toLowerCase();
		const isAuthorizedFromSignup =
			isAuthorized === AUTHORIZE &&
			Boolean(email) &&
			Boolean(storedEmail) &&
			storedEmail === email;

		if (!isAuthorizedFromSignup) {
			navigate("/auth/signup", { replace: true });
		}
	}, [isAuthorized, email, navigate]);

	useEffect(() => {
		if (seconds <= 0) return;
		const timer = setInterval(() => {
			setSeconds((s) => s - 1);
		}, 1000);
		return () => clearInterval(timer);
	}, [seconds]);

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length !== 6) return toast.error("Enter valid OTP");

		try {
			setIsVerifying(true);
			const res = await api.post("/auth/verify-otp", { email, otp });
			toast.success(res.data.message);
			sessionStorage.removeItem(SIGNUP_OTP_SESSION_KEY);
			const user = res.data.user as IUser;
			setAuthSession(user);
			if (user.role === "citizen") {
				navigate("/citizen/dashboard", { replace: true });
				return;
			}
			if (user.role === "city_admin") {
				navigate("/city-admin/dashboard", { replace: true });
				return;
			}
			navigate("/super-admin/dashboard", { replace: true });
		} catch (err: unknown) {
			if (err instanceof AxiosError)
				toast.error(err.response?.data?.error || "Invalid OTP");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResend = async () => {
		try {
			setIsResending(true);
			const res = await api.post("/auth/resend-otp", { email });
			toast.success(res.data.message);
			setSeconds(60);
		} catch (err: unknown) {
			if (err instanceof AxiosError)
				toast.error(err.response?.data?.error || "Please wait before resending");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="bg-background flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
			<div className="w-full max-w-md">
				<div className={cn("flex flex-col gap-7", className)} {...props}>
					<form onSubmit={handleVerify}>
						<FieldGroup>
							<div className="flex flex-col items-center gap-2 text-center">
								<h1 className="text-3xl font-bold">Enter verification code</h1>
								<FieldDescription className="text-base">
									We sent a 6-digit code to <b className="text-primary">{email}</b>
								</FieldDescription>
							</div>

							<Field>
								<FieldLabel htmlFor="otp" className="sr-only">
									Verification code
								</FieldLabel>

								<InputOTP
									maxLength={6}
									value={otp}
									onChange={setOtp}
									id="otp"
									required
									containerClassName="justify-center gap-4"
									disabled={isVerifying}
								>
									<InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
										<InputOTPSlot index={2} />
									</InputOTPGroup>
									<InputOTPSeparator />
									<InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-10 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
										<InputOTPSlot index={3} />
										<InputOTPSlot index={4} />
										<InputOTPSlot index={5} />
									</InputOTPGroup>
								</InputOTP>

								<FieldDescription className="text-center text-base">
									{seconds > 0 ? (
										<>Resend OTP in {seconds}s</>
									) : (
										<Button
											variant="link"
											type="button"
											onClick={handleResend}
											disabled={isResending}
											className="text-emerald-500 font-semibold"
										>
											Resend OTP
										</Button>
									)}
								</FieldDescription>
							</Field>

							<Field>
								<Button
									type="submit"
									className="h-10 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-base"
									disabled={isVerifying}
								>
									{isVerifying ? "Verifying" : "Verify"}
									{isVerifying && <Loader className="animate-spin" />}
								</Button>
							</Field>
						</FieldGroup>
					</form>

					<FieldDescription className="px-6 text-center text-base">
						By clicking continue, you agree to our{" "}
						<Link to="#" className="underline hover:text-[#129141]">Terms of Service</Link> and{" "}
						<Link to="#" className="underline hover:text-[#129141]">Privacy Policy</Link>.
					</FieldDescription>
				</div>
			</div>
		</div>
	);
}

