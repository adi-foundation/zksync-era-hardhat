// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

// import Foo.sol from current directory
import "./Bar.sol";

contract Import {
    Bar public bar = new Bar();

    constructor(){

    }
    // Initialize Bar

    // Test Foo.sol by getting it's name.
    function getFooName() public view returns (string memory) {
        return bar.foo().name();
    }
}
