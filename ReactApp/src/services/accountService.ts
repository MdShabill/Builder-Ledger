//Path: src/services/accountService.ts
import { API_URLS } from "../constants/urls";

export interface UserVmResponse {
  fullName: string;
  email: string;
}

export async function login(
  email: string,
  password: string
): Promise<UserVmResponse> {
  const response = await fetch(API_URLS.account.login, {
    method: "POST",
    headers: {"Content-Type": "application/json",},
    body: JSON.stringify({ email, password }),
  });

  const responseText = await response.text();

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = { message: responseText };
  }

  if (!response.ok) {
    throw new Error(data.message || data.title || responseText || "Invalid Email Or Password.");
  }

  localStorage.setItem("user",
    JSON.stringify({fullName: data.fullName, email: data.email,})
  );

  return data;
}


export function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("selectedSite");
}