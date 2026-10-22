import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sendApplicationSubmittedEmail,
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail,
} from '../services/emailService.js';

describe('Phase 19: Automated Email Notification Suite', () => {
  it('should successfully dispatch registration submission confirmation email with tracking ID', async () => {
    const result = await sendApplicationSubmittedEmail({
      applicantEmail: 'owner@newrestaurant.com',
      applicantName: 'Vikram Patel',
      restaurantName: 'Saffron Courtyard',
      applicationId: '6ac8b0ef603e906f8897cf9e',
      fssaiNumber: '11521018000452',
      city: 'Mumbai',
      state: 'Maharashtra',
    });

    assert.equal(result.success, true);
    assert.ok(result.messageId);
  });

  it('should successfully dispatch congratulations approval email to restaurant owner', async () => {
    const result = await sendApplicationApprovedEmail({
      applicantEmail: 'owner@newrestaurant.com',
      applicantName: 'Vikram Patel',
      restaurantName: 'Saffron Courtyard',
      loginEmail: 'owner@newrestaurant.com',
      subscriptionPlan: 'PREMIUM',
    });

    assert.equal(result.success, true);
    assert.ok(result.messageId);
  });

  it('should successfully dispatch rejection notification email with feedback reason', async () => {
    const result = await sendApplicationRejectedEmail({
      applicantEmail: 'owner@invalid.com',
      applicantName: 'Vikram Patel',
      restaurantName: 'Saffron Courtyard',
      rejectionReason: 'Invalid FSSAI documentation provided',
    });

    assert.equal(result.success, true);
    assert.ok(result.messageId);
  });
});
