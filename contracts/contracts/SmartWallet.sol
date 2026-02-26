// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SmartWallet
 * @notice Billetera inteligente compatible con ERC-4337 (Account Abstraction)
 * @dev Permite transacciones sin gas y recuperación social (simplificada por ahora)
 */
contract SmartWallet is BaseAccount, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IEntryPoint private immutable _entryPoint;

    constructor(IEntryPoint entryPoint_, address initialOwner) Ownable(initialOwner) {
        _entryPoint = entryPoint_;
    }

    /**
     * @notice Retorna el EntryPoint configurado
     */
    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @notice Ejecuta una transacción desde la billetera
     * @param dest Dirección destino
     * @param value Valor en ETH
     * @param func Datos de la función a llamar
     */
    function execute(address dest, uint256 value, bytes calldata func) external override {
        _requireFromEntryPoint();
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @notice Ejecuta un lote de transacciones
     * @param dests Direcciones destino
     * @param values Valores en ETH
     * @param funcs Datos de las funciones
     */
    function executeBatch(address[] calldata dests, uint256[] calldata values, bytes[] calldata funcs) external {
        _requireFromEntryPoint();
        require(dests.length == values.length && dests.length == funcs.length, "Wrong lengths");
        for (uint256 i = 0; i < dests.length; i++) {
            (bool success, bytes memory result) = dests[i].call{value: values[i]}(funcs[i]);
            if (!success) {
                assembly {
                    revert(add(result, 32), mload(result))
                }
            }
        }
    }

    /**
     * @notice Valida la firma del usuario para una UserOperation
     * @dev Sobrescribe la función de BaseAccount
     */
    function _validateSignature(PackedUserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        if (owner() != hash.recover(userOp.signature)) {
            return 1; // SIG_VALIDATION_FAILED
        }
        return 0; // SIG_VALIDATION_SUCCESS
    }
}
