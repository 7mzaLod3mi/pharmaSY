import { apiRequest } from "@/lib/http-client";
import type { AuthUser } from "@/features/auth/auth.types";

export interface OrganizationProfileInput {
  name: string;
  registrationNumber: string;
  address: string;
  city: string;
  phone: string;
}

export interface OrganizationProfile extends OrganizationProfileInput {
  id: string;
  status: string;
}

interface RawOrganizationProfile {
  id: string;
  name: string;
  licenseNumber?: string;
  tradeRegister?: string;
  address: string;
  city: string;
  phone: string;
  status: string;
}

function organizationPath(user: AuthUser) {
  return user.role === "PHARMACY" ? "/pharmacies/profile" : "/suppliers/profile";
}

function mapProfile(profile: RawOrganizationProfile): OrganizationProfile {
  return {
    id: profile.id,
    name: profile.name,
    registrationNumber:
      profile.licenseNumber ?? profile.tradeRegister ?? "",
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    status: profile.status,
  };
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
  async get(user: AuthUser) {
    const profile = await apiRequest<RawOrganizationProfile>({
      method: "GET",
      url: organizationPath(user),
    });
    return mapProfile(profile);
  },
  async update(
    user: AuthUser,
    input: Pick<
      OrganizationProfileInput,
      "name" | "address" | "city" | "phone"
    >
  ) {
    const profile = await apiRequest<RawOrganizationProfile>({
      method: "PATCH",
      url: organizationPath(user),
      data: input,
    });
    return mapProfile(profile);
  },
};
