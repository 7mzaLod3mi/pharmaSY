import { apiRequest } from "@/lib/http-client";
import type { AuthUser } from "@/features/auth/auth.types";

export interface OrganizationProfileInput {
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  phone: string;
}

export const organizationRepository = {
  create(user: AuthUser, input: OrganizationProfileInput) {
    const pharmacy = user.role === "PHARMACY";
    return apiRequest({
      method: "POST",
      url: pharmacy ? "/pharmacies/profile" : "/suppliers/profile",
      data: {
        name: input.name,
        [pharmacy ? "licenseNumber" : "tradeRegister"]: input.registrationNumber,
        address: input.address,
        city: input.city,
        phone: input.phone,
      },
    });
  },
};
