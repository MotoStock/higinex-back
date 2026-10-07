import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@Auth('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  list(@Query() query: GetUsersQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Get(':userId')
  getById(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.getUser(userId);
  }

  @Patch(':userId')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, updateUserDto);
  }

  @Patch(':userId/status')
  setStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.setUserActive(userId, dto.isActive);
  }

  @Delete(':userId')
  remove(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.deleteUser(userId);
  }
}
