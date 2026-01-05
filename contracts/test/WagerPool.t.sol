// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/WagerPool.sol";
import "../src/mocks/MockUSDC.sol";

contract WagerPoolTest is Test {
    WagerPool pool;
    MockUSDC usdc;
    address owner;
    address creator;
    address challenger;
    address platformWallet;

    uint256 wagerAmount = 50 * 10 ** 6; // 50 USDC

    function setUp() public {
        owner = makeAddr("owner");
        creator = makeAddr("creator");
        challenger = makeAddr("challenger");
        platformWallet = makeAddr("platform");

        // Deploy contracts
        usdc = new MockUSDC();

        vm.prank(owner);
        pool = new WagerPool(1, creator, wagerAmount, address(usdc), platformWallet);

        // Mint USDC to participants
        usdc.mint(creator, 1000 * 10 ** 6);
        usdc.mint(challenger, 1000 * 10 ** 6);
    }

    function testDepositWagerCreator() public {
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), wagerAmount);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Pending));
    }

    function testDepositWagerBothParticipants() public {
        // Creator deposits
        vm.startPrank(creator);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(creator);
        vm.stopPrank();

        // Challenger deposits
        vm.startPrank(challenger);
        usdc.approve(address(pool), wagerAmount);
        pool.depositWager(challenger);
        vm.stopPrank();

        assertEq(pool.getPrizePool(), wagerAmount * 2);
        assertEq(uint8(pool.getStatus()), uint8(IWagerPool.SessionStatus.Active));
    }

    function testCannotDepositWithoutApproval() public {
        vm.startPrank(creator);
        vm.expectRevert();
        pool.depositWager(creator);
        vm.stopPrank();
    }
}
