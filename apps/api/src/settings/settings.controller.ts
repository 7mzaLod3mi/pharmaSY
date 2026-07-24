import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@Controller({ path: 'settings', version: '1' })
export class SettingsController {}
