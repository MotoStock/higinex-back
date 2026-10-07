import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { ValidatedUserPayload } from 'src/auth/interfaces/validated-user-payload.interface';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateOrderNoteDto } from './dto/create-order-note.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@Auth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return await this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  async listOrders(
    @CurrentUser() user: ValidatedUserPayload,
    @Query() query: GetOrdersQueryDto,
  ) {
    return await this.ordersService.listOrders(user, query);
  }

  @Get(':orderId')
  async getOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: ValidatedUserPayload,
  ) {
    return await this.ordersService.getOrder(orderId, user);
  }

  @Post(':orderId/confirm-payment')
  @Auth('ADMIN')
  async confirmPayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return await this.ordersService.confirmPayment(
      orderId,
      userId,
      confirmPaymentDto,
    );
  }

  @Post(':orderId/cancel')
  @Auth('ADMIN')
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: ValidatedUserPayload,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return await this.ordersService.cancelOrder(orderId, user, cancelOrderDto);
  }

  @Post('expire-reservations')
  @Auth('ADMIN')
  async expireReservations(@CurrentUser('id') userId: string) {
    return await this.ordersService.expireReservations(userId);
  }

  @Patch(':orderId/status')
  @Auth('ADMIN')
  async updateStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return await this.ordersService.updateOrderStatus(orderId, userId, dto);
  }

  @Get(':orderId/notes')
  @Auth('ADMIN')
  listNotes(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ordersService.listOrderNotes(orderId);
  }

  @Post(':orderId/notes')
  @Auth('ADMIN')
  createNote(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderNoteDto,
  ) {
    return this.ordersService.createOrderNote(orderId, userId, dto);
  }

  @Delete(':orderId/notes/:noteId')
  @Auth('ADMIN')
  deleteNote(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    return this.ordersService.deleteOrderNote(orderId, noteId);
  }

  @Get(':orderId/shipments')
  @Auth('ADMIN')
  listShipments(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ordersService.listShipments(orderId);
  }

  @Post(':orderId/shipments')
  @Auth('ADMIN')
  createShipment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.ordersService.createShipment(orderId, dto);
  }

  @Patch(':orderId/shipments/:shipmentId')
  @Auth('ADMIN')
  updateShipment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.ordersService.updateShipment(orderId, shipmentId, dto);
  }

  @Get(':orderId/payments')
  @Auth('ADMIN')
  listPayments(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ordersService.listPayments(orderId);
  }

  @Get(':orderId/refunds')
  @Auth('ADMIN')
  listRefunds(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ordersService.listRefunds(orderId);
  }

  @Post(':orderId/refunds')
  @Auth('ADMIN')
  createRefund(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.ordersService.createRefund(orderId, userId, dto);
  }

  @Patch(':orderId/refunds/:refundId')
  @Auth('ADMIN')
  updateRefund(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('refundId', ParseUUIDPipe) refundId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRefundDto,
  ) {
    return this.ordersService.updateRefund(orderId, refundId, userId, dto);
  }

  @Get(':orderId/returns')
  @Auth('ADMIN')
  listReturns(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.ordersService.listReturns(orderId);
  }

  @Post(':orderId/returns')
  @Auth('ADMIN')
  createReturn(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.ordersService.createReturnRequest(orderId, userId, dto);
  }

  @Patch(':orderId/returns/:returnId')
  @Auth('ADMIN')
  updateReturn(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReturnRequestDto,
  ) {
    return this.ordersService.updateReturnRequest(
      orderId,
      returnId,
      userId,
      dto,
    );
  }
}
